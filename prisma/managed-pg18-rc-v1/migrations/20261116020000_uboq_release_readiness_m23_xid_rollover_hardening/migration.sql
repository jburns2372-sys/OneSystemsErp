-- Forward-only Migration #39: Release-Readiness Migration #23 XID Rollover Hardening
-- Preserves Migrations #1-#38, all T0-T12 models, role boundaries, and 252 public table count.
-- Replaces 32-bit-vs-64-bit (xmin::text::bigint = txid_current()) in h02b_company_read
-- with epoch-rollover-safe xid8->xid + age(xmin)=0 + 64-bit command-bound row registration.

ALTER TABLE public._company_payroll_commands
  ADD COLUMN IF NOT EXISTS created_row_keys text[] NOT NULL DEFAULT '{}'::text[];

CREATE OR REPLACE FUNCTION public.company_payroll_xmin_matches_xid8(
  p_tuple_xmin xid,
  p_xact_id8 xid8
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
SET search_path = pg_catalog
AS $$
  SELECT p_tuple_xmin = (p_xact_id8::xid);
$$;

ALTER FUNCTION public.company_payroll_xmin_matches_xid8(xid, xid8)
  OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_xmin_matches_xid8(xid, xid8) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_xmin_matches_xid8(xid, xid8)
  TO oserp_company_payroll_verifier, oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.company_payroll_created_in_current_xact(
  p_table text,
  p_row_id text,
  p_tuple_xmin xid
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NOT public.company_payroll_runtime() THEN
    RETURN false;
  END IF;

  IF p_table IS NULL
     OR p_table NOT IN ('PayrollPeriod', 'Payroll', 'DailyTimeRecord')
     OR p_row_id IS NULL
     OR p_tuple_xmin IS NULL
  THEN
    RETURN false;
  END IF;

  IF NOT public.company_payroll_xmin_matches_xid8(p_tuple_xmin, pg_catalog.pg_current_xact_id()) THEN
    RETURN false;
  END IF;

  IF pg_catalog.age(p_tuple_xmin) <> 0 THEN
    RETURN false;
  END IF;

  RETURN EXISTS (
    SELECT 1
      FROM public._company_payroll_commands c
     WHERE c.nonce = pg_catalog.current_setting('app.company_nonce', true)
       AND c.transaction_id = pg_catalog.txid_current()
       AND NOT c.completed
       AND c.operation = 'CREATE_PERIOD'
       AND (p_table || ':' || p_row_id) = ANY(c.created_row_keys)
  );
END;
$$;

ALTER FUNCTION public.company_payroll_created_in_current_xact(text, text, xid)
  OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_created_in_current_xact(text, text, xid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_created_in_current_xact(text, text, xid)
  TO oserp_company_payroll_app;

CREATE OR REPLACE FUNCTION public.company_payroll_guard(
  tbl text,
  operation text,
  old_row jsonb,
  new_row jsonb
)
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE j jsonb:=CASE WHEN operation='DELETE' THEN old_row ELSE new_row END;
 period_id text; p public."PayrollPeriod"%ROWTYPE; project_row public."Project"%ROWTYPE;
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 period_id:=CASE WHEN tbl='PayrollPeriod' THEN j->>'id' ELSE j->>'payrollPeriodId' END;
 IF tbl='PayrollPeriod' AND operation='INSERT' THEN
  IF current_setting('app.company_operation',true)<>'CREATE_PERIOD' OR j->>'id'<>current_setting('app.company_target_id',true)
   OR j->>'createdById' IS DISTINCT FROM current_setting('app.company_user_id',true)
   OR j->>'employerId' IS DISTINCT FROM current_setting('app.company_employer_id',true)
   OR j->>'projectId' IS NOT NULL OR j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((j->>'isLocked')::boolean,true)
   OR j->>'approvedById' IS NOT NULL OR j->>'dateApproved' IS NOT NULL OR j->>'dateReleased' IS NOT NULL
   OR j->>'employerOwnershipVerifiedAt' IS NULL OR j->>'employerOwnershipEvidenceRef' IS NULL THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CREATE_DENIED'; END IF;
  UPDATE public._company_payroll_commands
     SET created_row_keys = array_append(created_row_keys, tbl || ':' || (j->>'id'))
   WHERE nonce = current_setting('app.company_nonce', true)
     AND transaction_id = txid_current()
     AND NOT completed;
  RETURN;
 END IF;
 SELECT * INTO p FROM public."PayrollPeriod" WHERE id=period_id FOR UPDATE;
 IF NOT FOUND OR public.company_payroll_period_scope(p."employerId",p.id,p."employerOwnershipVerifiedAt",p."projectId") IS NOT TRUE
 OR p.status<>'DRAFT' OR p."isLocked" OR p."approvedById" IS NOT NULL OR p."dateApproved" IS NOT NULL OR p."dateReleased" IS NOT NULL
 OR EXISTS(SELECT 1 FROM public."PaymentBatch" WHERE "payrollPeriodId"=period_id)
 OR EXISTS(SELECT 1 FROM public."PayrollFundingRequest" WHERE "payrollPeriodId"=period_id)
 OR EXISTS(SELECT 1 FROM public."DeductionLog" WHERE "payrollPeriodId"=period_id)
 OR EXISTS(SELECT 1 FROM public."Payroll" r WHERE r."payrollPeriodId"=period_id AND (
 r."paymentBatchId" IS NOT NULL OR upper(COALESCE(r."paymentStatus",'')) NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION')
 OR EXISTS(SELECT 1 FROM public."PaymentBatchRow" br WHERE br."payrollId"=r.id)))
 THEN RAISE EXCEPTION 'COMPANY_PAYROLL_FINANCIAL_PROTECTION'; END IF;
 IF operation='UPDATE' THEN
  IF new_row->>'id' IS DISTINCT FROM old_row->>'id'
  OR (tbl='PayrollPeriod' AND (
   new_row->>'employerId' IS DISTINCT FROM old_row->>'employerId' OR new_row->>'projectId' IS DISTINCT FROM old_row->>'projectId'
   OR new_row->>'createdById' IS DISTINCT FROM old_row->>'createdById'
   OR new_row->>'employerOwnershipEvidenceRef' IS DISTINCT FROM old_row->>'employerOwnershipEvidenceRef'
   OR new_row->>'employerOwnershipVerifiedAt' IS DISTINCT FROM old_row->>'employerOwnershipVerifiedAt'))
  OR (tbl<>'PayrollPeriod' AND (new_row->>'workerId' IS DISTINCT FROM old_row->>'workerId'
   OR new_row->>'projectId' IS DISTINCT FROM old_row->>'projectId' OR new_row->>'payrollPeriodId' IS DISTINCT FROM old_row->>'payrollPeriodId'))
  THEN RAISE EXCEPTION 'COMPANY_PAYROLL_REPARENT_DENIED'; END IF;
 END IF;
 IF tbl='PayrollPeriod' THEN
  IF j->>'status'<>'DRAFT' OR (j->>'isLocked')::boolean OR j->>'approvedById' IS NOT NULL OR j->>'dateApproved' IS NOT NULL OR j->>'dateReleased' IS NOT NULL
  THEN RAISE EXCEPTION 'COMPANY_PAYROLL_WORKFLOW_DENIED'; END IF;
 ELSE
  PERFORM 1 FROM public."Worker" WHERE id=j->>'workerId' FOR SHARE;
  IF j->>'projectId' IS NOT NULL THEN PERFORM 1 FROM public."Project" WHERE id=j->>'projectId' FOR SHARE; END IF;
  IF public.company_payroll_child_scope(j->>'workerId',j->>'projectId',period_id) IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_WORKER_OWNER_DENIED'; END IF;
  IF tbl='Payroll' AND (j->>'paymentBatchId' IS NOT NULL OR upper(COALESCE(j->>'paymentStatus','')) NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION')) THEN RAISE EXCEPTION 'COMPANY_PAYROLL_PAID_DENIED'; END IF;
  IF tbl='DailyTimeRecord' AND (j->>'status'<>'DRAFT' OR (j->>'date')::timestamptz<p."startDate" OR (j->>'date')::timestamptz>p."endDate"
   OR (j->>'regularHours')::float<0 OR (j->>'overtimeHours')::float<0
   OR (j->>'regularHours')::float+(j->>'overtimeHours')::float>24) THEN RAISE EXCEPTION 'COMPANY_PAYROLL_DTR_DENIED'; END IF;
  IF operation='INSERT' AND current_setting('app.company_operation',true)='CREATE_PERIOD' THEN
   UPDATE public._company_payroll_commands
      SET created_row_keys = array_append(created_row_keys, tbl || ':' || (j->>'id'))
    WHERE nonce = current_setting('app.company_nonce', true)
      AND transaction_id = txid_current()
      AND NOT completed;
  END IF;
 END IF;
END $$;

ALTER FUNCTION public.company_payroll_guard(text, text, jsonb, jsonb)
  OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_guard(text, text, jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_guard(text, text, jsonb, jsonb)
  TO oserp_migrations_owner;

CREATE OR REPLACE FUNCTION public.company_payroll_finish()
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 INSERT INTO public."PayrollAuditLog"(id,"userId","actionType",module,"recordId","newValue",timestamp)
 VALUES('company-'||current_setting('app.company_nonce',true),current_setting('app.company_user_id',true),
 'COMPANY_'||current_setting('app.company_operation',true),'PAYROLL',current_setting('app.company_target_id',true),
 current_setting('app.company_payload_hash',true),clock_timestamp());
 UPDATE public._company_payroll_commands
    SET completed = true,
        created_row_keys = '{}'::text[]
  WHERE nonce = current_setting('app.company_nonce', true)
    AND transaction_id = txid_current();
END $$;

ALTER FUNCTION public.company_payroll_finish()
  OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_finish() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_finish()
  TO oserp_company_payroll_app;

ALTER POLICY h02b_company_read ON public."PayrollPeriod" USING (
  public.company_payroll_period_scope("employerId", id, "employerOwnershipVerifiedAt", "projectId")
  AND (
    current_setting('app.company_operation', true) <> 'CREATE_PERIOD'
    OR public.company_payroll_created_in_current_xact('PayrollPeriod', id, xmin)
  )
);

ALTER POLICY h02b_company_read ON public."Payroll" USING (
  public.company_payroll_child_scope("workerId", "projectId", "payrollPeriodId")
  AND (
    current_setting('app.company_operation', true) <> 'CREATE_PERIOD'
    OR public.company_payroll_created_in_current_xact('Payroll', id, xmin)
  )
);

ALTER POLICY h02b_company_read ON public."DailyTimeRecord" USING (
  public.company_payroll_child_scope("workerId", "projectId", "payrollPeriodId")
  AND (
    current_setting('app.company_operation', true) <> 'CREATE_PERIOD'
    OR public.company_payroll_created_in_current_xact('DailyTimeRecord', id, xmin)
  )
);

CREATE OR REPLACE FUNCTION public.uboq_inspect_xid_rollover_health()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_datfrozen_age bigint;
  v_datminmxid_age bigint;
  v_max_relfrozen_age bigint;
  v_autovacuum text;
  v_freeze_max_age bigint;
  v_failsafe_age bigint;
  v_legacy_xmin_policies integer;
  v_long_running_xacts integer;
BEGIN
  SELECT age(d.datfrozenxid)::bigint, mxid_age(d.datminmxid)::bigint
    INTO v_datfrozen_age, v_datminmxid_age
    FROM pg_catalog.pg_database d
   WHERE d.datname = pg_catalog.current_database();

  SELECT COALESCE(MAX(age(c.relfrozenxid)::bigint), 0)
    INTO v_max_relfrozen_age
    FROM pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind IN ('r', 'm', 't');

  v_autovacuum := pg_catalog.current_setting('autovacuum', true);
  v_freeze_max_age := COALESCE(NULLIF(pg_catalog.current_setting('autovacuum_freeze_max_age', true), ''), '200000000')::bigint;
  v_failsafe_age := COALESCE(NULLIF(pg_catalog.current_setting('vacuum_failsafe_age', true), ''), '1600000000')::bigint;

  SELECT COUNT(*)::integer
    INTO v_legacy_xmin_policies
    FROM pg_catalog.pg_policies pol
   WHERE pol.schemaname = 'public'
     AND (
       COALESCE(pol.qual, '') ~* 'xmin\)::text\)::bigint|xmin::text::bigint'
       OR COALESCE(pol.with_check, '') ~* 'xmin\)::text\)::bigint|xmin::text::bigint'
     );

  SELECT COUNT(*)::integer
    INTO v_long_running_xacts
    FROM pg_catalog.pg_stat_activity sa
   WHERE sa.datname = pg_catalog.current_database()
     AND sa.xact_start IS NOT NULL
     AND sa.pid <> pg_catalog.pg_backend_pid()
     AND EXTRACT(EPOCH FROM (pg_catalog.clock_timestamp() - sa.xact_start)) > 300;

  RETURN jsonb_build_object(
    'database', pg_catalog.current_database(),
    'datfrozenxidAge', v_datfrozen_age,
    'datminmxidAge', v_datminmxid_age,
    'maxPublicRelfrozenxidAge', v_max_relfrozen_age,
    'autovacuum', v_autovacuum,
    'autovacuumFreezeMaxAge', v_freeze_max_age,
    'vacuumFailsafeAge', v_failsafe_age,
    'headroomToAutovacuumFreeze', (v_freeze_max_age - v_datfrozen_age),
    'headroomToWraparoundStop', (2144483647::bigint - v_datfrozen_age),
    'legacyXminBigintPolicyCount', v_legacy_xmin_policies,
    'longRunningXactOver5mCount', v_long_running_xacts,
    'healthy', (
      v_autovacuum = 'on'
      AND v_datfrozen_age < v_freeze_max_age
      AND v_max_relfrozen_age < v_freeze_max_age
      AND v_legacy_xmin_policies = 0
      AND v_long_running_xacts = 0
    )
  );
END;
$$;

ALTER FUNCTION public.uboq_inspect_xid_rollover_health()
  OWNER TO oserp_migrations_owner;
REVOKE ALL ON FUNCTION public.uboq_inspect_xid_rollover_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.uboq_inspect_xid_rollover_health()
  TO oserp_migrations_owner;
