-- QA System Tables for Admin QA Mode

-- 1. Runtime errors table (for client-side error capture)
CREATE TABLE public.runtime_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  route TEXT,
  component TEXT,
  user_agent TEXT,
  sentry_event_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. QA check results (for historical tracking)
CREATE TABLE public.qa_check_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type TEXT NOT NULL,
  check_name TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  reason TEXT,
  response_time_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. QA report runs (for tracking scheduled/manual runs)
CREATE TABLE public.qa_report_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_type TEXT NOT NULL,
  overall_passed BOOLEAN NOT NULL,
  route_checks_passed INTEGER,
  route_checks_total INTEGER,
  db_checks_passed INTEGER,
  db_checks_total INTEGER,
  errors_24h INTEGER,
  report_sent_to TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.runtime_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_check_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qa_report_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for runtime_errors
CREATE POLICY "Admins can read all runtime errors"
ON public.runtime_errors FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Authenticated users can insert runtime errors"
ON public.runtime_errors FOR INSERT TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can delete runtime errors"
ON public.runtime_errors FOR DELETE TO authenticated
USING (public.is_admin());

-- RLS Policies for qa_check_results
CREATE POLICY "Admins can read qa check results"
ON public.qa_check_results FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert qa check results"
ON public.qa_check_results FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- RLS Policies for qa_report_runs
CREATE POLICY "Admins can read qa report runs"
ON public.qa_report_runs FOR SELECT TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can insert qa report runs"
ON public.qa_report_runs FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Index for faster queries
CREATE INDEX idx_runtime_errors_created_at ON public.runtime_errors(created_at DESC);
CREATE INDEX idx_qa_check_results_created_at ON public.qa_check_results(created_at DESC);
CREATE INDEX idx_qa_report_runs_created_at ON public.qa_report_runs(created_at DESC);