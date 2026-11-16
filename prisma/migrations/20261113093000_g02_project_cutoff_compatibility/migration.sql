-- Preserve prior project CUSTOM/CONSULTANT/PROJECT_BASED category selection, within signed project scope.
CREATE OR REPLACE FUNCTION public.uboq_h02_project_payroll_workers(p_project text,p_category text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE p record; w record; result jsonb:='[]'::jsonb;
BEGIN
 IF NOT (pg_has_role(session_user,'oserp_compat_app','MEMBER') OR pg_has_role(session_user,'oserp_legacy_app','MEMBER'))
   OR public.uboq_h02_ordinary_allowed(p_project,'PAYROLL','INSERT') IS NOT TRUE
 THEN RAISE EXCEPTION 'H02_PROJECT_PAYROLL_DENIED' USING ERRCODE='42501'; END IF;
 IF p_category NOT IN ('Weekly Salaried','Semi-Monthly','Monthly','*') OR p_category IS NULL
 THEN RAISE EXCEPTION 'H02_PAYROLL_CATEGORY_REQUIRED' USING ERRCODE='42501'; END IF;
 -- Serializes duplicate period checks/creation; authority revalidated after lock wait.
 SELECT id,"employerId","employerOwnershipVerifiedAt" INTO p FROM public."Project" WHERE id=p_project FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'H02_PROJECT_REQUIRED' USING ERRCODE='42501'; END IF;
 IF p."employerId" IS NOT NULL THEN
  PERFORM 1 FROM public."Employer" WHERE id=p."employerId" AND "verificationState"='VERIFIED' AND "verifiedAt" IS NOT NULL FOR SHARE;
  IF NOT FOUND OR p."employerOwnershipVerifiedAt" IS NULL THEN RAISE EXCEPTION 'H02_PROJECT_EMPLOYER_UNVERIFIED' USING ERRCODE='42501'; END IF;
 END IF;
 IF public.uboq_h02_ordinary_allowed(p_project,'PAYROLL','INSERT') IS NOT TRUE
 THEN RAISE EXCEPTION 'H02_PROJECT_PAYROLL_DENIED' USING ERRCODE='42501'; END IF;
 FOR w IN SELECT id,"employmentType","dailyRate","employerId","employerOwnershipVerifiedAt","employerOwnershipEvidenceRef"
   FROM public."Worker" WHERE "projectId"=p_project AND (p_category='*' OR "payrollCategory"=p_category) ORDER BY id FOR SHARE
 LOOP
  IF p."employerId" IS NULL OR (w."employerId"=p."employerId" AND w."employerOwnershipVerifiedAt" IS NOT NULL AND nullif(w."employerOwnershipEvidenceRef",'') IS NOT NULL) THEN
   result:=result||jsonb_build_array(jsonb_build_object('id',w.id,'employmentType',w."employmentType",'dailyRate',w."dailyRate"));
  END IF;
 END LOOP;
 RETURN result;
END $$;
