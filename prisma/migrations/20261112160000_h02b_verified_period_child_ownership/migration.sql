-- Forward-only H02-B #20. Preserve unresolved legacy project authorization.
-- Once a period has verified employer ownership, every child must inherit it,
-- including project-run children and Workers with no current project assignment.
CREATE FUNCTION public.company_payroll_verified_child_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE j jsonb:=CASE WHEN TG_OP='DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
 p public."PayrollPeriod"%ROWTYPE;
BEGIN
 IF j->>'payrollPeriodId' IS NULL THEN RETURN COALESCE(NEW,OLD); END IF;
 SELECT * INTO p FROM public."PayrollPeriod" WHERE id=j->>'payrollPeriodId' FOR SHARE;
 IF NOT FOUND OR p."employerId" IS NULL THEN RETURN COALESCE(NEW,OLD); END IF;
 IF p."employerOwnershipVerifiedAt" IS NULL THEN RAISE EXCEPTION 'H02B_PERIOD_EMPLOYER_UNVERIFIED'; END IF;
 PERFORM 1 FROM public."Employer" WHERE id=p."employerId" AND "verificationState"='VERIFIED' AND "verifiedAt" IS NOT NULL FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'H02B_PERIOD_EMPLOYER_UNVERIFIED'; END IF;
 PERFORM 1 FROM public."Worker" WHERE id=j->>'workerId' FOR SHARE;
 IF NOT EXISTS(SELECT 1 FROM public."Worker" w WHERE w.id=j->>'workerId'
  AND w."employerId"=p."employerId" AND w."employerOwnershipVerifiedAt" IS NOT NULL)
 THEN RAISE EXCEPTION 'H02B_PERIOD_WORKER_EMPLOYER_MISMATCH'; END IF;
 IF p."projectId" IS NOT NULL THEN
  PERFORM 1 FROM public."Project" WHERE id=p."projectId" FOR SHARE;
  IF NOT EXISTS(SELECT 1 FROM public."Project" pr WHERE pr.id=p."projectId" AND pr."employerId"=p."employerId" AND pr."employerOwnershipVerifiedAt" IS NOT NULL)
  OR (j->>'projectId' IS NOT NULL AND j->>'projectId' IS DISTINCT FROM p."projectId")
  THEN RAISE EXCEPTION 'H02B_PERIOD_PROJECT_EMPLOYER_MISMATCH'; END IF;
 END IF;
 IF j->>'projectId' IS NOT NULL THEN
  PERFORM 1 FROM public."Project" WHERE id=j->>'projectId' FOR SHARE;
  IF NOT EXISTS(SELECT 1 FROM public."Project" pr WHERE pr.id=j->>'projectId' AND pr."employerId"=p."employerId" AND pr."employerOwnershipVerifiedAt" IS NOT NULL)
  THEN RAISE EXCEPTION 'H02B_CHILD_PROJECT_EMPLOYER_MISMATCH'; END IF;
 END IF;
 RETURN COALESCE(NEW,OLD);
END $$;
ALTER FUNCTION public.company_payroll_verified_child_guard() OWNER TO oserp_company_payroll_verifier;
REVOKE ALL ON FUNCTION public.company_payroll_verified_child_guard() FROM PUBLIC;
CREATE TRIGGER a_h02b_verified_child BEFORE INSERT OR UPDATE OR DELETE ON public."Payroll" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_verified_child_guard();
CREATE TRIGGER a_h02b_verified_child BEFORE INSERT OR UPDATE OR DELETE ON public."DailyTimeRecord" FOR EACH ROW EXECUTE FUNCTION public.company_payroll_verified_child_guard();
