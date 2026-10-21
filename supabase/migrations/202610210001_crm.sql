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
