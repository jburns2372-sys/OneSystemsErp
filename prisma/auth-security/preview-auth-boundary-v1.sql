-- Reviewed auth-only boundary v1. The guarded deployment runner pins Preview.
-- Execute as one transaction. No ordinary ERP role receives table DML or EXECUTE.
DO $$ BEGIN
  IF NOT EXISTS(SELECT 1 FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace
    WHERE e.extname='pgcrypto' AND n.nspname='public') THEN
    RAISE EXCEPTION 'AUTH_PGCRYPTO_REQUIRED_IN_PUBLIC';
  END IF;
END $$;
CREATE ROLE oserp_auth_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE oserp_preview_auth_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
CREATE ROLE oserp_preview_delivery_service NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
-- Allow the already-privileged migration operator to transfer ownership. This
-- membership is not inherited and is never granted to the ERP/auth login roles.
GRANT oserp_auth_owner TO CURRENT_USER WITH INHERIT FALSE, SET TRUE;
CREATE SCHEMA oserp_auth_private AUTHORIZATION oserp_auth_owner;
-- Existing-object grants must be issued with the table owner's authority.
-- The privileged bootstrap supplies this only for the migration transaction.
GRANT SELECT (id,email,role,status,"passwordHash","failedLoginAttempts","lockedUntil","sessionVersion","mustChangePassword")
  ON public."User" TO oserp_auth_owner;
GRANT UPDATE ("failedLoginAttempts","lockedUntil","sessionVersion","passwordHash",password,"passwordChangedAt","mustChangePassword","updatedAt")
  ON public."User" TO oserp_auth_owner;
GRANT SELECT,INSERT,UPDATE ON public."PasswordRecoveryToken" TO oserp_auth_owner;
GRANT REFERENCES ("tokenHash") ON public."PasswordRecoveryToken" TO oserp_auth_owner;
GRANT INSERT ON public."AuditLog" TO oserp_auth_owner;
GRANT USAGE ON SCHEMA public TO oserp_auth_owner;

-- SET permission alone does not inherit schema-owner rights. Create/restrict
-- private objects explicitly as their NOLOGIN owner, never as the runtime user.
SET LOCAL ROLE oserp_auth_owner;
REVOKE ALL ON SCHEMA oserp_auth_private FROM PUBLIC;
GRANT USAGE ON SCHEMA oserp_auth_private TO oserp_preview_auth_service;
GRANT USAGE ON SCHEMA oserp_auth_private TO oserp_preview_delivery_service;

CREATE TABLE oserp_auth_private.recovery_budget (
  bucket text PRIMARY KEY, attempts integer NOT NULL CHECK(attempts BETWEEN 1 AND 5),
  window_started_at timestamptz NOT NULL, blocked_until timestamptz
);
ALTER TABLE oserp_auth_private.recovery_budget OWNER TO oserp_auth_owner;
CREATE TABLE oserp_auth_private.recovery_delivery (
  token_hash text PRIMARY KEY REFERENCES public."PasswordRecoveryToken"("tokenHash") ON DELETE CASCADE,
  state text NOT NULL CHECK(state IN ('PENDING','ACCEPTED','FAILED')),
  provider_id text, updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
ALTER TABLE oserp_auth_private.recovery_delivery OWNER TO oserp_auth_owner;
REVOKE ALL ON ALL TABLES IN SCHEMA oserp_auth_private FROM PUBLIC;

CREATE FUNCTION oserp_auth_private.audit(p_user text,p_role text,p_action text,p_note text)
RETURNS void LANGUAGE sql SET search_path=pg_catalog SET timezone='UTC' AS $$
  INSERT INTO public."AuditLog"(id,"userId","userRole","moduleName","transactionId","actionType",remarks)
  VALUES ('auth_'||pg_catalog.gen_random_uuid()::text,p_user,p_role,'SECURITY',p_user,p_action,p_note);
$$;
ALTER FUNCTION oserp_auth_private.audit(text,text,text,text) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.audit(text,text,text,text) FROM PUBLIC;

-- Password proof must be established INSIDE the privileged function. The caller
-- must never provide a boolean saying whether its password check succeeded.
-- pgcrypto's $2a$ bcrypt verifier is compatible with the application's $2b$
-- hash format after normalizing only the version prefix (verified in a
-- disposable PostgreSQL 18 fixture with ASCII, Unicode and 72-byte cases).
CREATE FUNCTION oserp_auth_private.login_attempt(p_email text,p_password text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' AS $$
DECLARE
  u record;
  stored_hash text;
  n integer;
  until_at timestamp;
  now_at timestamp:=clock_timestamp();
  dummy_hash constant text:='$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW';
BEGIN
  IF p_email IS NULL OR p_password IS NULL OR length(btrim(p_email))<3
     OR length(p_email)>254 OR length(p_password)=0 OR octet_length(p_password)>1024
  THEN RETURN NULL; END IF;

  -- A single row lock serializes validation with lockouts, resets and
  -- sessionVersion changes; no application-supplied proof can bypass it.
  IF (SELECT count(*) FROM public."User" WHERE lower(email)=lower(btrim(p_email)))<>1 THEN
    PERFORM public.crypt(p_password,dummy_hash);
    RETURN NULL;
  END IF;
  SELECT id,role,status,"passwordHash","failedLoginAttempts","lockedUntil",
         "sessionVersion","mustChangePassword" INTO u
    FROM public."User" WHERE lower(email)=lower(btrim(p_email)) FOR UPDATE;

  -- Once locked, deny promptly; avoid doing expensive bcrypt under the row
  -- lock for every request in a concurrent attack. The app has a response floor.
  IF NOT FOUND THEN
    PERFORM public.crypt(p_password,dummy_hash);
    RETURN NULL;
  END IF;
  IF u."lockedUntil">now_at THEN RETURN NULL; END IF;
  IF u.status<>'ACTIVE' OR u."passwordHash" IS NULL
     OR u."passwordHash" !~ '^\$2[ab]\$(10|11|12|13|14)\$[./A-Za-z0-9]{53}$'
  THEN
    PERFORM public.crypt(p_password,dummy_hash);
    RETURN NULL;
  END IF;

  stored_hash:=CASE WHEN left(u."passwordHash",4)='$2b$'
    THEN '$2a$'||substring(u."passwordHash" from 5)
    ELSE u."passwordHash" END;

  IF public.crypt(p_password,stored_hash)=stored_hash THEN
    IF u."failedLoginAttempts"<>0 OR u."lockedUntil" IS NOT NULL THEN
      UPDATE public."User" SET "failedLoginAttempts"=0,"lockedUntil"=NULL WHERE id=u.id;
    END IF;
    PERFORM oserp_auth_private.audit(u.id,u.role,'LOGIN_SUCCEEDED',
      'Credential verified within atomic database boundary');
    RETURN jsonb_build_object('id',u.id,'role',u.role,
      'sessionVersion',u."sessionVersion",'mustChangePassword',u."mustChangePassword");
  END IF;
  n:=least(5,(CASE WHEN u."lockedUntil" IS NOT NULL THEN 0
    ELSE greatest(u."failedLoginAttempts",0) END)+1);
  until_at:=CASE WHEN n>=5 THEN now_at+interval '15 minutes' ELSE NULL END;
  UPDATE public."User" SET "failedLoginAttempts"=n,"lockedUntil"=until_at,
    "sessionVersion"="sessionVersion"+CASE WHEN n>=5 THEN 1 ELSE 0 END WHERE id=u.id;
  PERFORM oserp_auth_private.audit(u.id,u.role,
    CASE WHEN n>=5 THEN 'LOGIN_TEMPORARILY_LOCKED' ELSE 'LOGIN_FAILED' END,
    CASE WHEN n>=5 THEN 'Five consecutive failures; locked for 15 minutes; prior sessions revoked'
    ELSE 'Invalid credentials' END);
  RETURN NULL;
END $$;
ALTER FUNCTION oserp_auth_private.login_attempt(text,text) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.login_attempt(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION oserp_auth_private.login_attempt(text,text) TO oserp_preview_auth_service;

CREATE FUNCTION oserp_auth_private.recovery_prepare(p_email text,p_hash text,p_ip_hash text,p_ua_hash text,p_can_deliver boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' AS $$
DECLARE b record; u record; key text; now_at timestamptz:=clock_timestamp(); token_id text;
BEGIN
  IF p_email IS NULL OR length(p_email)>254 OR length(p_email)<3 OR p_hash!~'^[a-f0-9]{64}$'
    OR p_hash IS NULL OR p_ip_hash!~'^[a-f0-9]{64}$' OR p_ua_hash!~'^[a-f0-9]{64}$' THEN RETURN NULL; END IF;
  -- Account-bound, not a forwarded IP or user-agent controlled budget.
  key:=encode(sha256(convert_to(lower(btrim(p_email)),'UTF8')),'hex');
  DELETE FROM oserp_auth_private.recovery_budget WHERE bucket IN
    (SELECT bucket FROM oserp_auth_private.recovery_budget
     WHERE window_started_at<now_at-interval '1 day' AND (blocked_until IS NULL OR blocked_until<now_at)
     LIMIT 32);
  INSERT INTO oserp_auth_private.recovery_budget(bucket,attempts,window_started_at)
    VALUES(key,1,now_at) ON CONFLICT DO NOTHING;
  IF NOT FOUND THEN
    SELECT * INTO b FROM oserp_auth_private.recovery_budget WHERE bucket=key FOR UPDATE;
    IF b.blocked_until>now_at THEN RETURN NULL; END IF;
    IF b.window_started_at<=now_at-interval '15 minutes' THEN
      UPDATE oserp_auth_private.recovery_budget SET attempts=1,window_started_at=now_at,blocked_until=NULL WHERE bucket=key;
    ELSIF b.attempts>=5 THEN RETURN NULL;
    ELSE
      UPDATE oserp_auth_private.recovery_budget SET attempts=attempts+1,
        blocked_until=CASE WHEN attempts+1>=5 THEN now_at+interval '15 minutes' ELSE NULL END WHERE bucket=key;
    END IF;
  END IF;
  IF (SELECT count(*) FROM public."User" WHERE lower(email)=lower(btrim(p_email)))<>1 THEN RETURN NULL; END IF;
  SELECT id,email,role,status INTO u FROM public."User" WHERE lower(email)=lower(btrim(p_email)) FOR UPDATE;
  IF NOT FOUND OR u.status<>'ACTIVE' THEN RETURN NULL; END IF;
  IF p_can_deliver IS DISTINCT FROM true THEN
    PERFORM oserp_auth_private.audit(u.id,u.role,'PASSWORD_RECOVERY_CONFIGURATION_MISSING','Recovery provider unavailable; no token issued'); RETURN NULL;
  END IF;
  UPDATE public."PasswordRecoveryToken" SET "revokedAt"=now_at WHERE "userId"=u.id AND "consumedAt" IS NULL AND "revokedAt" IS NULL;
  token_id:='auth_recovery_'||gen_random_uuid()::text;
  INSERT INTO public."PasswordRecoveryToken"(id,"userId","tokenHash",purpose,"expiresAt","requestedIpHash","requestedUserAgentHash")
    VALUES(token_id,u.id,p_hash,'PASSWORD_RESET',now_at+interval '30 minutes',p_ip_hash,p_ua_hash);
  INSERT INTO oserp_auth_private.recovery_delivery(token_hash,state) VALUES(p_hash,'PENDING');
  PERFORM oserp_auth_private.audit(u.id,u.role,'PASSWORD_RECOVERY_REQUESTED','30-minute single-use token prepared; prior tokens revoked');
  RETURN jsonb_build_object('email',u.email,'tokenId',token_id);
END $$;
ALTER FUNCTION oserp_auth_private.recovery_prepare(text,text,text,text,boolean) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.recovery_prepare(text,text,text,text,boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION oserp_auth_private.recovery_prepare(text,text,text,text,boolean) TO oserp_preview_auth_service;

CREATE FUNCTION oserp_auth_private.recovery_delivery_result(p_hash text,p_accepted boolean,p_provider_id text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' AS $$
DECLARE uid text; u record; t record;
BEGIN
  IF p_hash!~'^[a-f0-9]{64}$' OR p_hash IS NULL OR length(p_provider_id)>128 OR p_accepted IS NULL THEN RETURN false; END IF;
  SELECT "userId" INTO uid FROM public."PasswordRecoveryToken" WHERE "tokenHash"=p_hash;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT id,role INTO u FROM public."User" WHERE id=uid FOR UPDATE;
  SELECT * INTO t FROM public."PasswordRecoveryToken" WHERE "tokenHash"=p_hash FOR UPDATE;
  IF NOT FOUND OR t."consumedAt" IS NOT NULL OR t."revokedAt" IS NOT NULL THEN RETURN false; END IF;
  IF p_accepted AND t."expiresAt">clock_timestamp() AND nullif(p_provider_id,'') IS NOT NULL THEN
    UPDATE oserp_auth_private.recovery_delivery SET state='ACCEPTED',provider_id=p_provider_id,updated_at=clock_timestamp() WHERE token_hash=p_hash AND state='PENDING';
    IF NOT FOUND THEN RETURN false; END IF;
    PERFORM oserp_auth_private.audit(u.id,u.role,'PASSWORD_RECOVERY_PROVIDER_ACCEPTED','Provider accepted delivery request; inbox confirmation still required');
    RETURN true;
  END IF;
  UPDATE public."PasswordRecoveryToken" SET "revokedAt"=clock_timestamp() WHERE id=t.id;
  UPDATE oserp_auth_private.recovery_delivery SET state='FAILED',updated_at=clock_timestamp() WHERE token_hash=p_hash;
  PERFORM oserp_auth_private.audit(u.id,u.role,'PASSWORD_RECOVERY_EMAIL_DISPATCH_FAILED','Delivery failed; token revoked');
  RETURN false;
END $$;
ALTER FUNCTION oserp_auth_private.recovery_delivery_result(text,boolean,text) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.recovery_delivery_result(text,boolean,text) FROM PUBLIC;
-- Only the separate mail-dispatch identity may attest provider acceptance.
-- A stolen AUTH_DATABASE_URL alone cannot accept a self-chosen recovery token.
GRANT EXECUTE ON FUNCTION oserp_auth_private.recovery_delivery_result(text,boolean,text) TO oserp_preview_delivery_service;

CREATE FUNCTION oserp_auth_private.recovery_inspect(p_hash text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' AS $$
  SELECT jsonb_build_object('email',u.email) FROM public."PasswordRecoveryToken" t
    JOIN public."User" u ON u.id=t."userId"
    JOIN oserp_auth_private.recovery_delivery d ON d.token_hash=t."tokenHash" AND d.state='ACCEPTED'
    WHERE t."tokenHash"=p_hash AND t.purpose='PASSWORD_RESET' AND t."expiresAt">clock_timestamp()
      AND t."consumedAt" IS NULL AND t."revokedAt" IS NULL AND u.status='ACTIVE';
$$;
ALTER FUNCTION oserp_auth_private.recovery_inspect(text) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.recovery_inspect(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION oserp_auth_private.recovery_inspect(text) TO oserp_preview_auth_service;

CREATE FUNCTION oserp_auth_private.recovery_reset(p_hash text,p_new_hash text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog SET timezone='UTC' AS $$
DECLARE uid text; u record; t record;
BEGIN
  IF p_hash IS NULL OR p_hash!~'^[a-f0-9]{64}$' OR p_new_hash IS NULL OR length(p_new_hash)<>60
    OR p_new_hash!~'^\$2[ab]\$(10|11|12|13|14)\$[./A-Za-z0-9]{53}$' THEN RETURN false; END IF;
  SELECT "userId" INTO uid FROM public."PasswordRecoveryToken" WHERE "tokenHash"=p_hash;
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT id,role,status INTO u FROM public."User" WHERE id=uid FOR UPDATE;
  IF NOT FOUND OR u.status<>'ACTIVE' THEN RETURN false; END IF;
  SELECT * INTO t FROM public."PasswordRecoveryToken" WHERE "tokenHash"=p_hash FOR UPDATE;
  IF NOT FOUND OR t.purpose<>'PASSWORD_RESET' OR t."expiresAt"<=clock_timestamp()
    OR t."consumedAt" IS NOT NULL OR t."revokedAt" IS NOT NULL
    OR NOT EXISTS(SELECT 1 FROM oserp_auth_private.recovery_delivery WHERE token_hash=p_hash AND state='ACCEPTED') THEN RETURN false; END IF;
  UPDATE public."User" SET "passwordHash"=p_new_hash,password=NULL,"passwordChangedAt"=clock_timestamp(),
    "mustChangePassword"=false,"sessionVersion"="sessionVersion"+1,"failedLoginAttempts"=0,"lockedUntil"=NULL,"updatedAt"=clock_timestamp() WHERE id=u.id;
  UPDATE public."PasswordRecoveryToken" SET "consumedAt"=clock_timestamp() WHERE id=t.id;
  UPDATE public."PasswordRecoveryToken" SET "revokedAt"=clock_timestamp()
    WHERE "userId"=u.id AND id<>t.id AND "consumedAt" IS NULL AND "revokedAt" IS NULL;
  PERFORM oserp_auth_private.audit(u.id,u.role,'PASSWORD_RECOVERY_COMPLETED','Authorized single-use reset; sessions revoked; lockout cleared');
  RETURN true;
END $$;
ALTER FUNCTION oserp_auth_private.recovery_reset(text,text) OWNER TO oserp_auth_owner;
REVOKE ALL ON FUNCTION oserp_auth_private.recovery_reset(text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION oserp_auth_private.recovery_reset(text,text) TO oserp_preview_auth_service;

-- Role administration belongs to the authorized migration login, not the definer.
RESET ROLE;
ALTER ROLE oserp_preview_auth_service SET statement_timeout='10s';
ALTER ROLE oserp_preview_auth_service SET lock_timeout='3s';
ALTER ROLE oserp_preview_auth_service SET idle_in_transaction_session_timeout='10s';
ALTER ROLE oserp_preview_delivery_service SET statement_timeout='10s';
ALTER ROLE oserp_preview_delivery_service SET lock_timeout='3s';
ALTER ROLE oserp_preview_delivery_service SET idle_in_transaction_session_timeout='10s';
