-- Run in the Supabase SQL Editor as the database owner, or with npm run db:migrate.
-- Existing queries use these TEXT fields; keep names/types compatible with the CRM.
BEGIN;

CREATE TABLE IF NOT EXISTS public.crm_inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone TEXT NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  building TEXT NOT NULL DEFAULT '' CHECK (char_length(building) <= 200),
  reason TEXT NOT NULL CHECK (reason IN ('Administración de consorcios', 'Consulta inmobiliaria', 'Otra consulta')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 4000),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 5000),
  created_at TEXT NOT NULL,
  notification TEXT NOT NULL DEFAULT 'unconfigured' CHECK (notification IN ('unconfigured', 'sent', 'failed'))
);

CREATE TABLE IF NOT EXISTS public.crm_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL CHECK (count >= 1),
  reset_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS crm_inquiries_created ON public.crm_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS crm_inquiries_status_created ON public.crm_inquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS crm_limits_expiry ON public.crm_limits(reset_at);

-- The application connects only from the server, using the database owner connection.
-- No public Data API or Supabase Auth policies are needed for the current CRM login.
ALTER TABLE public.crm_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crm_inquiries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.crm_limits FROM PUBLIC, anon, authenticated;

COMMIT;

-- Apply after 202610210001_crm.sql. No user password is stored in this script.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
CREATE TABLE IF NOT EXISTS private.crm_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
REVOKE ALL ON TABLE private.crm_admins FROM PUBLIC, anon, authenticated;
INSERT INTO private.crm_admins(user_id)
SELECT id FROM auth.users
WHERE lower(email)='lemosmoralesadministracion@gmail.com' AND email_confirmed_at IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.crm_is_admin() RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=''
AS $$ SELECT EXISTS(SELECT 1 FROM private.crm_admins WHERE user_id=(SELECT auth.uid())) $$;
REVOKE ALL ON FUNCTION public.crm_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_is_admin() TO authenticated;

DROP POLICY IF EXISTS crm_admin_select ON public.crm_inquiries;
DROP POLICY IF EXISTS crm_admin_update ON public.crm_inquiries;
DROP POLICY IF EXISTS crm_admin_delete ON public.crm_inquiries;
CREATE POLICY crm_admin_select ON public.crm_inquiries FOR SELECT TO authenticated USING ((SELECT public.crm_is_admin()));
CREATE POLICY crm_admin_update ON public.crm_inquiries FOR UPDATE TO authenticated USING ((SELECT public.crm_is_admin())) WITH CHECK ((SELECT public.crm_is_admin()));
CREATE POLICY crm_admin_delete ON public.crm_inquiries FOR DELETE TO authenticated USING ((SELECT public.crm_is_admin()));
GRANT SELECT, DELETE ON public.crm_inquiries TO authenticated;
GRANT UPDATE(status,notes) ON public.crm_inquiries TO authenticated;
REVOKE ALL ON public.crm_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.crm_consume_limit(p_key TEXT,p_limit INTEGER,p_window BIGINT)
RETURNS BOOLEAN LANGUAGE plpgsql SET search_path='' AS $$
DECLARE v_now BIGINT := floor(extract(epoch FROM clock_timestamp())*1000); v_count INTEGER;
BEGIN
  INSERT INTO public.crm_limits(key,count,reset_at) VALUES(p_key,1,v_now+p_window)
  ON CONFLICT(key) DO UPDATE SET
    count=CASE WHEN public.crm_limits.reset_at<=v_now THEN 1 ELSE public.crm_limits.count+1 END,
    reset_at=CASE WHEN public.crm_limits.reset_at<=v_now THEN v_now+p_window ELSE public.crm_limits.reset_at END
  RETURNING count INTO v_count;
  RETURN v_count<=p_limit;
END $$;
REVOKE ALL ON FUNCTION private.crm_consume_limit(TEXT,INTEGER,BIGINT) FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.crm_submit_inquiry(
  p_id TEXT,p_name TEXT,p_email TEXT,p_phone TEXT,p_building TEXT,
  p_reason TEXT,p_message TEXT,p_started_at BIGINT,p_website TEXT DEFAULT ''
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_now BIGINT := floor(extract(epoch FROM clock_timestamp())*1000);
BEGIN
  IF p_id IS NULL OR p_id !~ '^[a-f0-9-]{36}$'
    OR p_name IS NULL OR char_length(trim(p_name)) NOT BETWEEN 1 AND 100
    OR p_email IS NULL OR char_length(p_email)>254 OR p_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$'
    OR char_length(coalesce(p_phone,''))>40 OR char_length(coalesce(p_building,''))>200
    OR p_reason IS NULL OR p_reason NOT IN ('Administración de consorcios','Consulta inmobiliaria','Otra consulta')
    OR p_message IS NULL OR char_length(trim(p_message)) NOT BETWEEN 1 AND 4000
    OR p_started_at IS NULL OR p_started_at<=0 OR p_started_at>v_now-2000
    OR coalesce(trim(p_website),'')<>'' THEN
    RAISE EXCEPTION 'crm_invalid_inquiry';
  END IF;
  DELETE FROM public.crm_limits WHERE reset_at<v_now;
  IF NOT private.crm_consume_limit('submit-global',100,600000)
    OR NOT private.crm_consume_limit('submit-email:'||md5(lower(trim(p_email))),3,600000) THEN
    RAISE EXCEPTION 'crm_rate_limit';
  END IF;
  INSERT INTO public.crm_inquiries(id,name,email,phone,building,reason,message,created_at)
  VALUES(p_id,trim(p_name),lower(trim(p_email)),coalesce(p_phone,''),coalesce(p_building,''),p_reason,trim(p_message),
    to_char(clock_timestamp() AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'));
  RETURN p_id;
END $$;
REVOKE ALL ON FUNCTION public.crm_submit_inquiry(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BIGINT,TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_submit_inquiry(TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,TEXT,BIGINT,TEXT) TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.crm_list_inquiries(p_search TEXT DEFAULT '',p_status TEXT DEFAULT '',p_page INTEGER DEFAULT 1)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path='' AS $$
DECLARE v_rows JSONB;v_counts JSONB;v_total BIGINT;v_search TEXT;v_offset INTEGER;
BEGIN
  IF NOT public.crm_is_admin() THEN RAISE EXCEPTION 'crm_not_authorized' USING ERRCODE='42501'; END IF;
  v_search := '%'||replace(replace(replace(left(coalesce(p_search,''),200),'!','!!'),'%','!%'),'_','!_')||'%';
  v_offset := (greatest(1,least(coalesce(p_page,1),100000))-1)*20;
  SELECT count(*) INTO v_total FROM public.crm_inquiries
    WHERE (coalesce(p_status,'')='' OR status=p_status)
    AND (name||' '||email||' '||building||' '||message) ILIKE v_search ESCAPE '!';
  SELECT coalesce(jsonb_agg(to_jsonb(q)),'[]'::jsonb) INTO v_rows FROM (
    SELECT * FROM public.crm_inquiries WHERE (coalesce(p_status,'')='' OR status=p_status)
    AND (name||' '||email||' '||building||' '||message) ILIKE v_search ESCAPE '!'
    ORDER BY created_at DESC LIMIT 20 OFFSET v_offset
  ) q;
  SELECT coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) INTO v_counts FROM (
    SELECT status,count(*) AS total FROM public.crm_inquiries GROUP BY status
  ) c;
  RETURN jsonb_build_object('rows',v_rows,'total',v_total,'counts',v_counts);
END $$;
REVOKE ALL ON FUNCTION public.crm_list_inquiries(TEXT,TEXT,INTEGER) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.crm_list_inquiries(TEXT,TEXT,INTEGER) TO authenticated;

CREATE OR REPLACE FUNCTION public.crm_connection_status() RETURNS JSONB
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT jsonb_build_object('schema_version',2,'admin_ready',EXISTS(SELECT 1 FROM private.crm_admins))
$$;
REVOKE ALL ON FUNCTION public.crm_connection_status() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.crm_connection_status() TO anon,authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
