-- Forward-only H02-B #19: no enrollment or historical assignment.
CREATE OR REPLACE FUNCTION public.company_payroll_ledgers(w text) RETURNS SETOF jsonb
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF public.company_payroll_worker_scope(w) IS NOT TRUE THEN RAISE EXCEPTION 'COMPANY_PAYROLL_WORKER_DENIED'; END IF;
 IF EXISTS(SELECT 1 FROM public."DeductionLedger" WHERE "workerId"=w AND status='ACTIVE') THEN RAISE EXCEPTION 'COMPANY_PAYROLL_UNVERIFIED_FINANCIAL_DEPENDENCY'; END IF;
 RETURN;
END $$;
ALTER FUNCTION public.company_payroll_ledgers(text) OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_ledgers(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.company_payroll_ledgers(text) TO oserp_company_payroll_app;
CREATE FUNCTION public.company_payroll_history_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
 IF (NEW."employerId",NEW."employerOwnershipEvidenceRef",NEW."employerOwnershipVerifiedAt") IS DISTINCT FROM (OLD."employerId",OLD."employerOwnershipEvidenceRef",OLD."employerOwnershipVerifiedAt")
 AND (OLD.status<>'DRAFT' OR OLD."isLocked" OR OLD."approvedById" IS NOT NULL OR OLD."dateApproved" IS NOT NULL OR OLD."dateReleased" IS NOT NULL
 OR EXISTS(SELECT 1 FROM public."Payroll" p WHERE p."payrollPeriodId"=OLD.id AND (upper(COALESCE(p."paymentStatus",'')) NOT IN ('PENDING','UNPAID','ON_HOLD','EXCEPTION') OR p."paymentBatchId" IS NOT NULL))
 OR EXISTS(SELECT 1 FROM public."PaymentBatch" b WHERE b."payrollPeriodId"=OLD.id)
 OR EXISTS(SELECT 1 FROM public."PayrollFundingRequest" f WHERE f."payrollPeriodId"=OLD.id)
 OR EXISTS(SELECT 1 FROM public."DeductionLog" d WHERE d."payrollPeriodId"=OLD.id))
 THEN RAISE EXCEPTION 'COMPANY_PAYROLL_PROTECTED_HISTORY'; END IF;
 RETURN NEW;
END $$;
ALTER FUNCTION public.company_payroll_history_guard() OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_history_guard() FROM PUBLIC;
CREATE TRIGGER h02b_history_guard BEFORE UPDATE ON public."PayrollPeriod" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_history_guard();
