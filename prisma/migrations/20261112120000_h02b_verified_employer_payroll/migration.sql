-- H02-B forward-only #18; no employer enrollment or historical assignment.
-- CreateEnum
CREATE TYPE "EmployerVerificationState" AS ENUM ('UNVERIFIED', 'VERIFIED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EmployerPayrollOperation" AS ENUM ('VIEW', 'CREATE_PERIOD', 'EDIT_DRAFT', 'COMPUTE_DRAFT', 'IMPORT_DTR', 'DELETE_DRAFT');

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "employerId" TEXT,
ADD COLUMN     "employerOwnershipEvidenceRef" TEXT,
ADD COLUMN     "employerOwnershipVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "employerId" TEXT,
ADD COLUMN     "employerOwnershipEvidenceRef" TEXT,
ADD COLUMN     "employerOwnershipVerifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PayrollPeriod" ADD COLUMN     "employerId" TEXT,
ADD COLUMN     "employerOwnershipEvidenceRef" TEXT,
ADD COLUMN     "employerOwnershipVerifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "verificationEvidenceRef" TEXT NOT NULL,
    "verificationState" "EmployerVerificationState" NOT NULL DEFAULT 'UNVERIFIED',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerPayrollAuthority" (
    "employerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operation" "EmployerPayrollOperation" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "verificationEvidenceRef" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerPayrollAuthority_pkey" PRIMARY KEY ("employerId","userId","operation")
);

-- CreateIndex
CREATE INDEX "EmployerPayrollAuthority_userId_idx" ON "EmployerPayrollAuthority"("userId");

-- CreateIndex
CREATE INDEX "Project_employerId_idx" ON "Project"("employerId");

-- CreateIndex
CREATE INDEX "Worker_employerId_idx" ON "Worker"("employerId");

-- CreateIndex
CREATE INDEX "PayrollPeriod_employerId_idx" ON "PayrollPeriod"("employerId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "PayrollPeriod" ADD CONSTRAINT "PayrollPeriod_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EmployerPayrollAuthority" ADD CONSTRAINT "EmployerPayrollAuthority_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "EmployerPayrollAuthority" ADD CONSTRAINT "EmployerPayrollAuthority_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;


-- Dedicated invoker role and verifier. Neither has BYPASSRLS or LOGIN; no runtime
-- membership in the verifier is granted. Existing project roles/policies are retained.
DO $role$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='oserp_company_payroll_app') THEN CREATE ROLE oserp_company_payroll_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='oserp_company_payroll_app' AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolcreatedb OR rolcreaterole)) THEN RAISE EXCEPTION 'UNSAFE_EXISTING_COMPANY_ROLE'; END IF;
END $role$;
DO $role$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='oserp_company_payroll_verifier') THEN CREATE ROLE oserp_company_payroll_verifier NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS; END IF;
 IF EXISTS(SELECT 1 FROM pg_roles WHERE rolname='oserp_company_payroll_verifier' AND (rolsuper OR rolbypassrls OR rolcanlogin OR rolcreatedb OR rolcreaterole)) THEN RAISE EXCEPTION 'UNSAFE_EXISTING_COMPANY_ROLE'; END IF;
END $role$;
GRANT USAGE ON SCHEMA public TO oserp_company_payroll_app,oserp_company_payroll_verifier;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
CREATE TABLE public._company_payroll_trust_anchor (
 id boolean PRIMARY KEY DEFAULT true CHECK(id),
 secret_hex text NOT NULL CHECK(secret_hex ~ '^[0-9a-f]{64}$')
);
CREATE TABLE public._company_payroll_commands (
 nonce text PRIMARY KEY, employer_id text NOT NULL, user_id text NOT NULL,
 operation text NOT NULL, target_id text NOT NULL, payload_hash text NOT NULL,
 transaction_id bigint NOT NULL, completed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public."Employer",public."EmployerPayrollAuthority",
 public._company_payroll_trust_anchor,public._company_payroll_commands
 FROM PUBLIC,oserp_compat_app,oserp_legacy_app,oserp_company_payroll_app;
REVOKE ALL ON public."Worker",public."GovernmentSettings",public."DeductionLedger"
 FROM oserp_company_payroll_app;
GRANT SELECT ON public."Employer",public."EmployerPayrollAuthority",
 public._company_payroll_trust_anchor,public._company_payroll_commands,
 public."User",public."Worker",public."Project",public."PayrollPeriod",
 public."Payroll",public."DailyTimeRecord",public."PaymentBatch",
 public."PayrollFundingRequest",public."PaymentBatchRow",public."DeductionLog",
 public."DeductionLedger",public."GovernmentSettings"
 TO oserp_company_payroll_verifier;
GRANT INSERT,UPDATE ON public._company_payroll_commands TO oserp_company_payroll_verifier;
GRANT INSERT ON public."PayrollAuditLog" TO oserp_company_payroll_verifier;
-- Lock-only privilege; WITH CHECK(false) below prevents verifier DML.
GRANT UPDATE(id) ON public."User",public."Employer",public."Worker",public."Project",
 public."PayrollPeriod" TO oserp_company_payroll_verifier;
GRANT UPDATE("userId") ON public."EmployerPayrollAuthority" TO oserp_company_payroll_verifier;
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['Employer','EmployerPayrollAuthority','_company_payroll_trust_anchor','_company_payroll_commands'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY h02b_verifier_read ON public.%I FOR SELECT TO oserp_company_payroll_verifier USING(true)',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['PayrollPeriod','Payroll','DailyTimeRecord','Project'] LOOP
  EXECUTE format('CREATE POLICY h02b_verifier_read ON public.%I FOR SELECT TO oserp_company_payroll_verifier USING(true)',t);
 END LOOP;
 FOREACH t IN ARRAY ARRAY['Employer','EmployerPayrollAuthority','PayrollPeriod','Project'] LOOP
  EXECUTE format('CREATE POLICY h02b_verifier_lock ON public.%I FOR UPDATE TO oserp_company_payroll_verifier USING(true) WITH CHECK(false)',t);
 END LOOP;
END $$;
CREATE POLICY h02b_verifier_insert ON public._company_payroll_commands FOR INSERT TO oserp_company_payroll_verifier WITH CHECK(true);
CREATE POLICY h02b_verifier_finish ON public._company_payroll_commands FOR UPDATE TO oserp_company_payroll_verifier USING(transaction_id=txid_current()) WITH CHECK(transaction_id=txid_current());
ALTER TABLE public."Employer" ADD CONSTRAINT h02b_verified_employer_evidence CHECK (
 length(btrim("verificationEvidenceRef"))>0 AND ("verificationState"<>'VERIFIED' OR "verifiedAt" IS NOT NULL));
ALTER TABLE public."EmployerPayrollAuthority" ADD CONSTRAINT h02b_verified_grant_evidence CHECK (
 length(btrim("verificationEvidenceRef"))>0 AND (NOT enabled OR ("verifiedAt" IS NOT NULL AND "revokedAt" IS NULL)));
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['Worker','Project','PayrollPeriod'] LOOP
  EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT h02b_ownership_evidence CHECK (
   ("employerId" IS NULL AND "employerOwnershipEvidenceRef" IS NULL AND "employerOwnershipVerifiedAt" IS NULL)
   OR ("employerId" IS NOT NULL AND length(btrim("employerOwnershipEvidenceRef"))>0 AND "employerOwnershipEvidenceRef" IS NOT NULL AND "employerOwnershipVerifiedAt" IS NOT NULL))',t);
 END LOOP;
END $$;

CREATE FUNCTION public.company_payroll_runtime() RETURNS boolean
LANGUAGE sql STABLE SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT pg_has_role(session_user,'oserp_company_payroll_app','MEMBER')
 AND NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=session_user AND rolsuper)
$$;

CREATE FUNCTION public.company_payroll_proof_valid() RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE e text:=current_setting('app.company_employer_id',true);
 u text:=current_setting('app.company_user_id',true); sv text:=current_setting('app.company_session_version',true);
 op text:=current_setting('app.company_operation',true); target text:=current_setting('app.company_target_id',true);
 digest text:=current_setting('app.company_payload_hash',true); issued text:=current_setting('app.company_issued',true);
 nonce text:=current_setting('app.company_nonce',true); sim text:=COALESCE(current_setting('app.company_simulated_role',true),'');
 signature text:=current_setting('app.company_signature',true); secret text; expected text; now_sec bigint;
BEGIN
 IF NOT public.company_payroll_runtime() OR e IS NULL OR u IS NULL OR sv !~ '^[0-9]+$'
  OR op NOT IN ('VIEW','CREATE_PERIOD','EDIT_DRAFT','COMPUTE_DRAFT','IMPORT_DTR','DELETE_DRAFT')
  OR digest !~ '^[0-9a-f]{64}$' OR nonce !~ '^[0-9a-f]{32}$' OR issued !~ '^[0-9]{10,12}$'
  OR signature !~ '^[0-9a-f]{64}$' OR target IS NULL THEN RETURN false; END IF;
 now_sec:=extract(epoch from clock_timestamp())::bigint;
 IF issued::bigint>now_sec+5 OR now_sec-issued::bigint>60 THEN RETURN false; END IF;
 SELECT secret_hex INTO secret FROM public._company_payroll_trust_anchor WHERE id;
 IF secret IS NULL THEN RETURN false; END IF;
 expected:=encode(public.hmac(convert_to(concat_ws('|','OSERP_COMPANY_PAYROLL_V1',e,u,sv,op,target,digest,issued,nonce,sim),'UTF8'),decode(secret,'hex'),'sha256'),'hex');
 IF expected IS DISTINCT FROM signature THEN RETURN false; END IF;
 RETURN EXISTS(SELECT 1 FROM public."Employer" emp
  JOIN public."EmployerPayrollAuthority" a ON a."employerId"=emp.id
  JOIN public."User" actor ON actor.id=a."userId"
  WHERE emp.id=e AND emp."verificationState"='VERIFIED' AND emp."verifiedAt" IS NOT NULL
  AND a."userId"=u AND a.operation::text=op AND a.enabled AND a."verifiedAt" IS NOT NULL AND a."revokedAt" IS NULL
  AND actor.role IN ('SUPER_ADMIN','SYSTEM_ADMIN') AND actor.status='ACTIVE'
  AND actor."sessionVersion"::text=sv AND NOT actor."mustChangePassword"
  AND (actor."lockedUntil" IS NULL OR actor."lockedUntil"<=clock_timestamp())
  AND (sim='' OR sim=actor.role));
EXCEPTION WHEN OTHERS THEN RETURN false;
END $$;

CREATE FUNCTION public.company_payroll_context() RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.company_payroll_proof_valid() AND EXISTS(
  SELECT 1 FROM public._company_payroll_commands c
  WHERE c.nonce=current_setting('app.company_nonce',true) AND c.transaction_id=txid_current() AND NOT c.completed
  AND c.employer_id=current_setting('app.company_employer_id',true) AND c.user_id=current_setting('app.company_user_id',true)
  AND c.operation=current_setting('app.company_operation',true) AND c.target_id=current_setting('app.company_target_id',true)
  AND c.payload_hash=current_setting('app.company_payload_hash',true))
$$;

CREATE FUNCTION public.company_payroll_begin() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE target text:=current_setting('app.company_target_id',true);
 op text:=current_setting('app.company_operation',true); p public."PayrollPeriod"%ROWTYPE;
BEGIN
 IF public.company_payroll_proof_valid() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_AUTHORITY_DENIED' USING ERRCODE='42501'; END IF;
 -- Serialize authority revocation/session invalidation against this transaction.
 PERFORM 1 FROM public."User" WHERE id=current_setting('app.company_user_id',true) FOR SHARE;
 IF op='CREATE_PERIOD' THEN
  PERFORM 1 FROM public."Employer" WHERE id=current_setting('app.company_employer_id',true) FOR UPDATE;
 ELSE
  PERFORM 1 FROM public."Employer" WHERE id=current_setting('app.company_employer_id',true) FOR SHARE;
 END IF;
 PERFORM 1 FROM public."EmployerPayrollAuthority"
  WHERE "employerId"=current_setting('app.company_employer_id',true)
  AND "userId"=current_setting('app.company_user_id',true) AND operation::text=op FOR SHARE;
 IF public.company_payroll_proof_valid() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_REVOKED'; END IF;
 IF op<>'CREATE_PERIOD' AND NOT(op='VIEW' AND target='*') THEN
  SELECT * INTO p FROM public."PayrollPeriod" WHERE id=target FOR UPDATE;
  IF p.id IS NULL OR p."projectId" IS NOT NULL OR p."employerId" IS DISTINCT FROM current_setting('app.company_employer_id',true)
   OR p."employerOwnershipVerifiedAt" IS NULL THEN RAISE EXCEPTION 'COMPANY_PAYROLL_OWNER_DENIED'; END IF;
 END IF;
 INSERT INTO public._company_payroll_commands(nonce,employer_id,user_id,operation,target_id,payload_hash,transaction_id)
 VALUES(current_setting('app.company_nonce',true),current_setting('app.company_employer_id',true),current_setting('app.company_user_id',true),
 op,target,current_setting('app.company_payload_hash',true),txid_current());
 IF op NOT IN ('VIEW','CREATE_PERIOD') THEN PERFORM public.company_payroll_guard('PayrollPeriod','UPDATE',to_jsonb(p),to_jsonb(p)); END IF;
END $$;

CREATE FUNCTION public.company_payroll_period_scope(e text,p text,verified timestamptz,project text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.company_payroll_context() AND e=current_setting('app.company_employer_id',true)
 AND verified IS NOT NULL AND project IS NULL
 AND (p=current_setting('app.company_target_id',true) OR current_setting('app.company_operation',true)='CREATE_PERIOD'
 OR (current_setting('app.company_operation',true)='VIEW' AND current_setting('app.company_target_id',true)='*'))
$$;

CREATE FUNCTION public.company_payroll_worker_scope(w text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.company_payroll_context() AND EXISTS(SELECT 1 FROM public."Worker" worker
 WHERE worker.id=w AND worker."employerId"=current_setting('app.company_employer_id',true)
 AND worker."employerOwnershipVerifiedAt" IS NOT NULL
 AND (worker."projectId" IS NULL OR EXISTS(SELECT 1 FROM public."Project" p WHERE p.id=worker."projectId"
 AND p."employerId"=worker."employerId" AND p."employerOwnershipVerifiedAt" IS NOT NULL)))
$$;

CREATE FUNCTION public.company_payroll_child_scope(w text,project text,period text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.company_payroll_worker_scope(w)
 AND EXISTS(SELECT 1 FROM public."PayrollPeriod" p WHERE p.id=period
  AND public.company_payroll_period_scope(p."employerId",p.id,p."employerOwnershipVerifiedAt",p."projectId")
  AND (project IS NULL OR EXISTS(SELECT 1 FROM public."Project" pr WHERE pr.id=project
  AND pr."employerId"=p."employerId" AND pr."employerOwnershipVerifiedAt" IS NOT NULL)))
$$;

CREATE FUNCTION public.company_payroll_workers() RETURNS SETOF jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 RETURN QUERY SELECT to_jsonb(w) FROM public."Worker" w WHERE public.company_payroll_worker_scope(w.id) FOR SHARE OF w;
END $$;
CREATE FUNCTION public.company_payroll_ledgers(w text) RETURNS SETOF jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_worker_scope(w) IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_WORKER_DENIED'; END IF;
 RETURN QUERY SELECT to_jsonb(l) FROM public."DeductionLedger" l WHERE l."workerId"=w AND l.status='ACTIVE';
END $$;
CREATE FUNCTION public.company_payroll_settings() RETURNS jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 RETURN (SELECT to_jsonb(g) FROM public."GovernmentSettings" g ORDER BY id LIMIT 1);
END $$;
CREATE FUNCTION public.company_payroll_guard(tbl text,operation text,old_row jsonb,new_row jsonb) RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
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
 END IF;
END $$;

CREATE FUNCTION public.company_payroll_finish() RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 INSERT INTO public."PayrollAuditLog"(id,"userId","actionType",module,"recordId","newValue",timestamp)
 VALUES('company-'||current_setting('app.company_nonce',true),current_setting('app.company_user_id',true),
 'COMPANY_'||current_setting('app.company_operation',true),'PAYROLL',current_setting('app.company_target_id',true),
 current_setting('app.company_payload_hash',true),clock_timestamp());
 UPDATE public._company_payroll_commands SET completed=true WHERE nonce=current_setting('app.company_nonce',true) AND transaction_id=txid_current();
END $$;
CREATE FUNCTION public.company_payroll_authority_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE j jsonb:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
BEGIN
 INSERT INTO public."PayrollAuditLog"(id,"userId","actionType",module,"recordId",remarks,timestamp)
 VALUES('grant-'||public.gen_random_uuid()::text,j->>'userId','EMPLOYER_AUTHORITY_'||TG_OP,'PAYROLL',j->>'employerId',
 'Database enrollment actor: '||session_user,clock_timestamp());
 RETURN COALESCE(NEW,OLD);
END $$;
CREATE TRIGGER h02b_authority_audit AFTER INSERT OR UPDATE OR DELETE ON public."EmployerPayrollAuthority" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_authority_audit();

CREATE FUNCTION public.company_payroll_ownership_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE old_j jsonb; j jsonb:=to_jsonb(NEW); runtime boolean;
BEGIN
 runtime:=public.company_payroll_runtime() OR pg_has_role(session_user,'oserp_compat_app','MEMBER') OR pg_has_role(session_user,'oserp_legacy_app','MEMBER');
 runtime:=runtime AND NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=session_user AND rolsuper);
 IF TG_OP='UPDATE' THEN
  old_j:=to_jsonb(OLD);
  IF old_j->>'employerId' IS NOT NULL AND (
   j->>'employerId' IS DISTINCT FROM old_j->>'employerId' OR j->>'employerOwnershipEvidenceRef' IS DISTINCT FROM old_j->>'employerOwnershipEvidenceRef'
   OR j->>'employerOwnershipVerifiedAt' IS DISTINCT FROM old_j->>'employerOwnershipVerifiedAt')
  THEN RAISE EXCEPTION 'EMPLOYER_OWNERSHIP_IMMUTABLE'; END IF;
  IF runtime AND (j->>'employerId' IS DISTINCT FROM old_j->>'employerId'
   OR j->>'employerOwnershipEvidenceRef' IS DISTINCT FROM old_j->>'employerOwnershipEvidenceRef'
   OR j->>'employerOwnershipVerifiedAt' IS DISTINCT FROM old_j->>'employerOwnershipVerifiedAt') THEN RAISE EXCEPTION 'EMPLOYER_ENROLLMENT_DENIED'; END IF;
 END IF;
 IF j->>'employerId' IS NOT NULL THEN
  IF runtime AND TG_OP='INSERT' AND NOT(TG_TABLE_NAME='PayrollPeriod' AND public.company_payroll_context()) THEN RAISE EXCEPTION 'EMPLOYER_ENROLLMENT_DENIED'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public."Employer" e WHERE e.id=j->>'employerId' AND e."verificationState"='VERIFIED' AND e."verifiedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'EMPLOYER_VERIFICATION_REQUIRED'; END IF;
  IF TG_TABLE_NAME IN ('Worker','PayrollPeriod') AND j->>'projectId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."Project" p WHERE p.id=j->>'projectId' AND p."employerId"=j->>'employerId' AND p."employerOwnershipVerifiedAt" IS NOT NULL) THEN RAISE EXCEPTION 'EMPLOYER_PROJECT_MISMATCH'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER h02b_worker_owner BEFORE INSERT OR UPDATE ON public."Worker" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_ownership_guard();
CREATE TRIGGER h02b_project_owner BEFORE INSERT OR UPDATE ON public."Project" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_ownership_guard();
CREATE TRIGGER h02b_period_owner BEFORE INSERT OR UPDATE ON public."PayrollPeriod" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_ownership_guard();

GRANT SELECT,INSERT,UPDATE,DELETE ON public."PayrollPeriod",public."Payroll",public."DailyTimeRecord" TO oserp_company_payroll_app;
CREATE POLICY h02b_company_read ON public."PayrollPeriod" FOR SELECT TO oserp_company_payroll_app
 USING(public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId"));
CREATE POLICY h02b_company_insert ON public."PayrollPeriod" FOR INSERT TO oserp_company_payroll_app
 WITH CHECK(public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId") AND current_setting('app.company_operation',true)='CREATE_PERIOD' AND id=current_setting('app.company_target_id',true));
CREATE POLICY h02b_company_update ON public."PayrollPeriod" FOR UPDATE TO oserp_company_payroll_app
 USING(public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId") AND current_setting('app.company_operation',true) IN ('EDIT_DRAFT','COMPUTE_DRAFT','IMPORT_DTR','DELETE_DRAFT'))
 WITH CHECK(public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId") AND current_setting('app.company_operation',true)='EDIT_DRAFT');
CREATE POLICY h02b_company_delete ON public."PayrollPeriod" FOR DELETE TO oserp_company_payroll_app
 USING(public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId") AND current_setting('app.company_operation',true)='DELETE_DRAFT');
DO $$
DECLARE t text;
BEGIN
 FOREACH t IN ARRAY ARRAY['Payroll','DailyTimeRecord'] LOOP
  EXECUTE format('CREATE POLICY h02b_company_read ON public.%I FOR SELECT TO oserp_company_payroll_app USING(public.company_payroll_child_scope("workerId","projectId","payrollPeriodId"))',t);
  EXECUTE format('CREATE POLICY h02b_company_insert ON public.%I FOR INSERT TO oserp_company_payroll_app WITH CHECK(public.company_payroll_child_scope("workerId","projectId","payrollPeriodId") AND current_setting(''app.company_operation'',true) IN (%s))',t,CASE WHEN t='Payroll' THEN '''CREATE_PERIOD'',''COMPUTE_DRAFT'',''IMPORT_DTR''' ELSE '''IMPORT_DTR''' END);
  EXECUTE format('CREATE POLICY h02b_company_update ON public.%I FOR UPDATE TO oserp_company_payroll_app USING(public.company_payroll_child_scope("workerId","projectId","payrollPeriodId") AND current_setting(''app.company_operation'',true) IN (''COMPUTE_DRAFT'',''IMPORT_DTR'',''DELETE_DRAFT'')) WITH CHECK(public.company_payroll_child_scope("workerId","projectId","payrollPeriodId") AND current_setting(''app.company_operation'',true) IN (''COMPUTE_DRAFT'',''IMPORT_DTR''))',t);
  EXECUTE format('CREATE POLICY h02b_company_delete ON public.%I FOR DELETE TO oserp_company_payroll_app USING(public.company_payroll_child_scope("workerId","projectId","payrollPeriodId") AND current_setting(''app.company_operation'',true) IN (%s))',t,CASE WHEN t='Payroll' THEN '''DELETE_DRAFT'',''COMPUTE_DRAFT'',''IMPORT_DTR''' ELSE '''DELETE_DRAFT''' END);
 END LOOP;
END $$;

-- All verifier functions use a non-login, NOBYPASSRLS owner. Only the explicit
-- callable surface is granted; private guard/proof helpers are not PUBLIC.

-- Only the company runtime branch is added; original project branch below remains unchanged.
CREATE OR REPLACE FUNCTION public.uboq_h02_guard_ordinary_write() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE j jsonb:=to_jsonb(NEW); old_j jsonb; p text; old_p text; parent_row record;
BEGIN
 IF public.company_payroll_runtime() THEN
  PERFORM public.company_payroll_guard(TG_TABLE_NAME,TG_OP,to_jsonb(OLD),to_jsonb(NEW));
  RETURN NEW;
 END IF;
 IF TG_OP='UPDATE' THEN
  old_j:=to_jsonb(OLD);
  IF j->>'id' IS DISTINCT FROM old_j->>'id' THEN RAISE EXCEPTION 'H02_ORDINARY_ID_CHANGE_DENIED'; END IF;
 END IF;
 IF TG_TABLE_NAME='ProgramOfWorks' THEN
  SELECT "projectId",status,"isLocked" INTO parent_row FROM public."SubcontractPackage" WHERE id=j->>'packageId' FOR UPDATE;
  p:=parent_row."projectId";
  IF p IS NULL OR parent_row.status<>'DRAFT' OR parent_row."isLocked" THEN RAISE EXCEPTION 'H02_PACKAGE_NOT_EDITABLE'; END IF;
  IF TG_OP='UPDATE' AND j->>'packageId' IS DISTINCT FROM old_j->>'packageId' THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
 ELSIF TG_TABLE_NAME IN ('SubcontractPackage','JobOrder') THEN
  p:=j->>'projectId';
  IF TG_OP='UPDATE' AND p IS DISTINCT FROM old_j->>'projectId' THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
  IF j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((j->>'isLocked')::boolean,false) OR NULLIF(j->>'approvedBy','') IS NOT NULL
   OR (TG_OP='UPDATE' AND (old_j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((old_j->>'isLocked')::boolean,false) OR NULLIF(old_j->>'approvedBy','') IS NOT NULL)) THEN RAISE EXCEPTION 'H02_ORDINARY_WORKFLOW_DENIED'; END IF;
  IF TG_TABLE_NAME='JobOrder' AND j->>'packageId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."SubcontractPackage" WHERE id=j->>'packageId' AND "projectId"=p) THEN RAISE EXCEPTION 'H02_FOREIGN_PACKAGE_DENIED'; END IF;
  IF j->>'consolidatedBoqItemId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."ConsolidatedBOQItem" WHERE id=j->>'consolidatedBoqItemId' AND "projectId"=p AND "isUboqResourceGoverned" IS NOT TRUE) THEN RAISE EXCEPTION 'H02_FOREIGN_OR_GOVERNED_RESOURCE_DENIED'; END IF;
  IF j->>'awardedBoqItemId' IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public."AwardedBOQItem" WHERE id=j->>'awardedBoqItemId' AND "projectId"=p) THEN RAISE EXCEPTION 'H02_FOREIGN_AWARDED_ITEM_DENIED'; END IF;
 ELSE
  p:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN j->>'projectId' ELSE public.uboq_h02_payroll_child_project(j->>'projectId',j->>'payrollPeriodId') END;
  IF p IS NULL THEN RAISE EXCEPTION 'H02_PAYROLL_OWNERSHIP_REQUIRED'; END IF;
  IF TG_OP='UPDATE' THEN
   old_p:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN old_j->>'projectId' ELSE public.uboq_h02_payroll_child_project(old_j->>'projectId',old_j->>'payrollPeriodId') END;
   IF p IS DISTINCT FROM old_p OR (TG_TABLE_NAME<>'PayrollPeriod' AND j->>'workerId' IS DISTINCT FROM old_j->>'workerId')
    OR (TG_TABLE_NAME<>'PayrollPeriod' AND old_j->>'payrollPeriodId' IS NOT NULL AND j->>'payrollPeriodId' IS DISTINCT FROM old_j->>'payrollPeriodId') THEN RAISE EXCEPTION 'H02_ORDINARY_REPARENT_DENIED'; END IF;
  END IF;
  IF TG_TABLE_NAME='PayrollPeriod' THEN
   IF TG_OP='INSERT' THEN
    IF NEW."createdById" IS NOT NULL AND NEW."createdById" IS DISTINCT FROM current_setting('app.current_user_id',true) THEN RAISE EXCEPTION 'H02_PAYROLL_CREATOR_DENIED'; END IF;
    NEW."createdById":=current_setting('app.current_user_id',true);
   ELSIF j->>'createdById' IS DISTINCT FROM old_j->>'createdById' THEN RAISE EXCEPTION 'H02_PAYROLL_CREATOR_DENIED'; END IF;
   IF j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((j->>'isLocked')::boolean,false) OR j->>'dateApproved' IS NOT NULL OR j->>'dateReleased' IS NOT NULL OR j->>'approvedById' IS NOT NULL
    OR (TG_OP='UPDATE' AND (old_j->>'status' IS DISTINCT FROM 'DRAFT' OR COALESCE((old_j->>'isLocked')::boolean,false) OR old_j->>'dateApproved' IS NOT NULL OR old_j->>'dateReleased' IS NOT NULL)) THEN RAISE EXCEPTION 'H02_PAYROLL_WORKFLOW_DENIED'; END IF;
  ELSIF j->>'payrollPeriodId' IS NOT NULL THEN
   SELECT "projectId",status,"isLocked","dateApproved","dateReleased" INTO parent_row FROM public."PayrollPeriod" WHERE id=j->>'payrollPeriodId' FOR UPDATE;
   IF parent_row."projectId" IS DISTINCT FROM p OR parent_row.status IS DISTINCT FROM 'DRAFT' OR parent_row."isLocked" OR parent_row."dateApproved" IS NOT NULL OR parent_row."dateReleased" IS NOT NULL THEN RAISE EXCEPTION 'H02_PAYROLL_WORKFLOW_DENIED'; END IF;
  END IF;
  IF TG_TABLE_NAME<>'PayrollPeriod' AND NOT EXISTS(SELECT 1 FROM public."Worker" WHERE id=j->>'workerId' AND ("projectId" IS NULL OR "projectId"=p)) THEN RAISE EXCEPTION 'H02_PAYROLL_WORKER_SCOPE_DENIED'; END IF;
  IF TG_TABLE_NAME='Payroll' AND (COALESCE(j->>'paymentStatus','') NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION') OR (TG_OP='UPDATE' AND COALESCE(old_j->>'paymentStatus','') NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION'))) THEN RAISE EXCEPTION 'H02_PAID_PAYROLL_WRITE_DENIED'; END IF;
  IF TG_TABLE_NAME='DailyTimeRecord' AND (j->>'status' IS DISTINCT FROM 'DRAFT' OR (TG_OP='UPDATE' AND old_j->>'status' IS DISTINCT FROM 'DRAFT')) THEN RAISE EXCEPTION 'H02_DTR_WORKFLOW_DENIED'; END IF;
 END IF;
 IF public.uboq_h02_ordinary_allowed(p,CASE WHEN TG_TABLE_NAME IN ('SubcontractPackage','ProgramOfWorks','JobOrder') THEN 'SUBCONTRACTING' ELSE 'PAYROLL' END,TG_OP) IS NOT TRUE THEN RAISE EXCEPTION 'H02_ORDINARY_WRITE_DENIED' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END $$;

-- Only the company runtime branch is added; original project branch below remains unchanged.
CREATE OR REPLACE FUNCTION public.uboq_guard_payroll_delete() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp AS $$
DECLARE period_row public."PayrollPeriod"%ROWTYPE; period_id text;
BEGIN
 IF public.company_payroll_runtime() THEN
  PERFORM public.company_payroll_guard(TG_TABLE_NAME,TG_OP,to_jsonb(OLD),to_jsonb(NEW));
  RETURN OLD;
 END IF;
 period_id:=CASE WHEN TG_TABLE_NAME='PayrollPeriod' THEN OLD.id ELSE to_jsonb(OLD)->>'payrollPeriodId' END;
 SELECT * INTO period_row FROM public."PayrollPeriod" WHERE id=period_id FOR UPDATE;
 IF period_row.id IS NULL OR period_row.status<>'DRAFT' OR period_row."isLocked" OR period_row."dateApproved" IS NOT NULL OR period_row."dateReleased" IS NOT NULL THEN
  RAISE EXCEPTION 'UBOQ_PAYROLL_DELETE_PROTECTED: only unlocked, unapproved DRAFT periods';
 END IF;
 IF TG_TABLE_NAME<>'PayrollPeriod' AND public.uboq_h02_payroll_child_project(to_jsonb(OLD)->>'projectId',period_id) IS DISTINCT FROM period_row."projectId" THEN RAISE EXCEPTION 'UBOQ_PAYROLL_CROSS_PROJECT_DENIED'; END IF;
 IF TG_TABLE_NAME='Payroll' AND upper(COALESCE(to_jsonb(OLD)->>'paymentStatus','')) NOT IN ('UNPAID','PENDING') THEN RAISE EXCEPTION 'UBOQ_PAYROLL_PAID_DELETE_DENIED'; END IF;
 RETURN OLD;
END $$;

DO $$
DECLARE f regprocedure;
BEGIN
 FOR f IN SELECT p.oid::regprocedure FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public' AND p.proname LIKE 'company_payroll_%' LOOP
  EXECUTE format('ALTER FUNCTION %s OWNER TO oserp_company_payroll_verifier',f);
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC',f);
 END LOOP;
END $$;
GRANT EXECUTE ON FUNCTION public.company_payroll_begin(),public.company_payroll_finish(),
 public.company_payroll_period_scope(text,text,timestamptz,text),public.company_payroll_child_scope(text,text,text),
 public.company_payroll_workers(),public.company_payroll_ledgers(text),public.company_payroll_settings()
 TO oserp_company_payroll_app;
GRANT EXECUTE ON FUNCTION public.company_payroll_runtime(),public.company_payroll_guard(text,text,jsonb,jsonb)
 TO oserp_migrations_owner;

-- Private NOBYPASS verifier may inspect only verified project ownership metadata.
-- Existing real-project tenant policy remains the exact ELSE branch for all
-- application roles. The company login has no direct Project SELECT grant.
REVOKE SELECT ON public."Project" FROM oserp_company_payroll_verifier;
GRANT SELECT(id,"employerId","employerOwnershipVerifiedAt") ON public."Project" TO oserp_company_payroll_verifier;
ALTER POLICY rls_restrictive_tenant_scope ON public."Project"
 USING(CASE WHEN current_user='oserp_company_payroll_verifier'
 THEN "employerId" IS NOT NULL AND "employerOwnershipVerifiedAt" IS NOT NULL
 ELSE public.uboq_check_tenant_rls(id) END)
 WITH CHECK(public.uboq_check_tenant_rls(id));
