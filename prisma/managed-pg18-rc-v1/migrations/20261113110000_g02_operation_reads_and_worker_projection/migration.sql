-- Forward-only #23. Preserve all historical migrations and payroll calculations.
CREATE OR REPLACE FUNCTION public.company_payroll_period_scope(e text,p text,verified timestamptz,project text) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
 SELECT public.company_payroll_context() AND e=current_setting('app.company_employer_id',true)
 AND verified IS NOT NULL AND project IS NULL
 AND (p=current_setting('app.company_target_id',true)
 OR (current_setting('app.company_operation',true)='VIEW' AND current_setting('app.company_target_id',true)='*'))
$$;

-- CREATE can read its own newly inserted rows for RETURNING, never old rows,
-- even if an existing historical ID is supplied as the signed command target.
ALTER POLICY h02b_company_read ON public."PayrollPeriod" USING (
 public.company_payroll_period_scope("employerId",id,"employerOwnershipVerifiedAt","projectId")
 AND (current_setting('app.company_operation',true)<>'CREATE_PERIOD' OR xmin::text::bigint=txid_current()));
ALTER POLICY h02b_company_read ON public."Payroll" USING (
 public.company_payroll_child_scope("workerId","projectId","payrollPeriodId")
 AND (current_setting('app.company_operation',true)<>'CREATE_PERIOD' OR xmin::text::bigint=txid_current()));
ALTER POLICY h02b_company_read ON public."DailyTimeRecord" USING (
 public.company_payroll_child_scope("workerId","projectId","payrollPeriodId")
 AND (current_setting('app.company_operation',true)<>'CREATE_PERIOD' OR xmin::text::bigint=txid_current()));

-- Minimum metadata surface: a boolean, no period IDs, amounts, dates or DTR.
-- company_payroll_begin holds the employer lock across check and insertion.
CREATE FUNCTION public.company_payroll_period_exists(m integer,y integer,rule text,kind text) RETURNS boolean
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_context() IS NOT TRUE OR current_setting('app.company_operation',true)<>'CREATE_PERIOD'
 THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CREATE_CONTEXT_REQUIRED'; END IF;
 RETURN EXISTS(SELECT 1 FROM public."PayrollPeriod" p
 WHERE p."employerId"=current_setting('app.company_employer_id',true) AND p."projectId" IS NULL
 AND p.month=m AND p.year=y AND p."calendarRule"=rule AND p."periodType"=kind);
END $$;
ALTER FUNCTION public.company_payroll_period_exists(integer,integer,text,text) OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_period_exists(integer,integer,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_period_exists(integer,integer,text,text) TO oserp_company_payroll_app;

CREATE OR REPLACE FUNCTION public.company_payroll_workers() RETURNS SETOF jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE op text:=current_setting('app.company_operation',true); fields text[];
BEGIN
 IF public.company_payroll_context() IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_CONTEXT_REQUIRED'; END IF;
 fields:=CASE
 WHEN op='VIEW' THEN ARRAY['id','firstName','lastName','projectId','payrollCategory']
 WHEN op='CREATE_PERIOD' THEN ARRAY['id','payrollCategory','employmentType','dailyRate']
 WHEN op IN ('COMPUTE_DRAFT','IMPORT_DTR') THEN ARRAY[
 'id','subjectToPayrollCutoff','payrollCategory','rateType','basicMonthlySalary','standardWorkHours',
 'dailyRate','hourlyRate','pieceRate','contractAmount','retentionPercentage','professionalFee',
 'sssDeductionEnabled','philHealthDeductionEnabled','pagibigDeductionEnabled',
 'withholdingTaxEnabled','withholdingTaxType','withholdingTaxRate','allowedPaymentMethod',
 'gcashNumber','gcashVerificationStatus','bankAccountNumber','bankVerificationStatus']
 ELSE ARRAY[]::text[] END;
 -- EDIT/DELETE have no Worker dependency and return no employment metadata.
 IF cardinality(fields)=0 THEN RETURN; END IF;
 RETURN QUERY SELECT (SELECT jsonb_object_agg(k,to_jsonb(w)->k) FROM unnest(fields) k)
 FROM public."Worker" w WHERE public.company_payroll_worker_scope(w.id) FOR SHARE OF w;
END $$;
