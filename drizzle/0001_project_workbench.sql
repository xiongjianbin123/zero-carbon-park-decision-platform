CREATE TABLE IF NOT EXISTS workspace_users (
  id TEXT PRIMARY KEY,
  sites_user_id TEXT UNIQUE,
  email TEXT NOT NULL COLLATE NOCASE,
  org_role TEXT NOT NULL CHECK (org_role IN ('org_admin', 'org_member')),
  invitation_status TEXT NOT NULL CHECK (invitation_status IN ('invited', 'active', 'disabled')),
  invited_by TEXT,
  last_login_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_users_email ON workspace_users(email);

CREATE TABLE IF NOT EXISTS parks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  park_type TEXT NOT NULL,
  leading_industries TEXT NOT NULL DEFAULT '[]',
  baseline_year INTEGER NOT NULL,
  target_year INTEGER NOT NULL,
  application_direction TEXT NOT NULL DEFAULT '',
  data_baseline_date TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'archived')),
  created_by TEXT NOT NULL REFERENCES workspace_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (target_year >= baseline_year)
);

CREATE INDEX IF NOT EXISTS idx_parks_status ON parks(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS park_members (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES workspace_users(id),
  email TEXT NOT NULL COLLATE NOCASE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'specialist', 'viewer')),
  member_status TEXT NOT NULL CHECK (member_status IN ('invited', 'active', 'disabled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_park_members_park_user ON park_members(park_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_park_members_park_email ON park_members(park_id, email);

CREATE TABLE IF NOT EXISTS imports (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  import_type TEXT NOT NULL CHECK (import_type IN ('energy_monthly', 'load_curve', 'enterprises', 'projects')),
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_digest TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  period_start TEXT,
  period_end TEXT,
  interval_minutes INTEGER,
  accepted_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'replaced')),
  imported_by TEXT NOT NULL REFERENCES workspace_users(id),
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_imports_deduplicate ON imports(park_id, import_type, file_digest) WHERE status = 'succeeded';
CREATE INDEX IF NOT EXISTS idx_imports_park_period ON imports(park_id, import_type, period_start, period_end);

CREATE TABLE IF NOT EXISTS energy_monthly (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  report_month TEXT NOT NULL,
  electricity_kwh REAL NOT NULL CHECK (electricity_kwh >= 0),
  electricity_cost_yuan REAL NOT NULL CHECK (electricity_cost_yuan >= 0),
  green_electricity_kwh REAL CHECK (green_electricity_kwh >= 0),
  natural_gas_m3 REAL CHECK (natural_gas_m3 >= 0),
  heat_gj REAL CHECK (heat_gj >= 0),
  steam_t REAL CHECK (steam_t >= 0)
);

CREATE INDEX IF NOT EXISTS idx_energy_monthly_park_period ON energy_monthly(park_id, report_month);
CREATE INDEX IF NOT EXISTS idx_energy_monthly_import ON energy_monthly(import_id);

CREATE TABLE IF NOT EXISTS load_curve_points (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  recorded_at TEXT NOT NULL,
  load_kw REAL NOT NULL CHECK (load_kw >= 0),
  solar_kw REAL CHECK (solar_kw >= 0),
  storage_charge_kw REAL CHECK (storage_charge_kw >= 0),
  storage_discharge_kw REAL CHECK (storage_discharge_kw >= 0),
  interval_minutes INTEGER NOT NULL CHECK (interval_minutes IN (15, 30, 60))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_load_curve_park_time ON load_curve_points(park_id, import_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_load_curve_import ON load_curve_points(import_id);

CREATE TABLE IF NOT EXISTS enterprises (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  import_id TEXT NOT NULL REFERENCES imports(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  annual_output_ten_thousand_yuan REAL CHECK (annual_output_ten_thousand_yuan >= 0),
  comprehensive_energy_tce REAL CHECK (comprehensive_energy_tce >= 0),
  annual_electricity_kwh REAL CHECK (annual_electricity_kwh >= 0),
  key_energy_consumer INTEGER NOT NULL DEFAULT 0 CHECK (key_energy_consumer IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_enterprises_park_industry ON enterprises(park_id, industry);
CREATE INDEX IF NOT EXISTS idx_enterprises_import ON enterprises(import_id);

CREATE TABLE IF NOT EXISTS park_projects (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  import_id TEXT REFERENCES imports(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  status TEXT NOT NULL,
  investment_ten_thousand_yuan REAL CHECK (investment_ten_thousand_yuan >= 0),
  capacity_value REAL CHECK (capacity_value >= 0),
  capacity_unit TEXT,
  planned_start_date TEXT,
  planned_operation_date TEXT,
  expected_reduction_tco2e REAL CHECK (expected_reduction_tco2e >= 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_park_projects_park_status ON park_projects(park_id, status, planned_start_date);
CREATE INDEX IF NOT EXISTS idx_park_projects_import ON park_projects(import_id);

CREATE TABLE IF NOT EXISTS indicator_results (
  id TEXT PRIMARY KEY,
  diagnosis_run_id TEXT NOT NULL,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  indicator_key TEXT NOT NULL,
  indicator_version TEXT NOT NULL,
  current_value REAL,
  target_value REAL,
  unit TEXT,
  status TEXT NOT NULL CHECK (status IN ('achieved', 'gap', 'missing_data', 'not_applicable')),
  input_import_ids TEXT NOT NULL DEFAULT '[]',
  calculation_note TEXT NOT NULL,
  missing_data TEXT NOT NULL DEFAULT '[]',
  calculated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_indicator_results_park_run ON indicator_results(park_id, diagnosis_run_id, calculated_at DESC);
CREATE INDEX IF NOT EXISTS idx_indicator_results_park_status ON indicator_results(park_id, status, calculated_at DESC);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  source_indicator_id TEXT REFERENCES indicator_results(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'in_progress', 'blocked', 'done')),
  review_note TEXT NOT NULL DEFAULT '',
  created_by TEXT NOT NULL REFERENCES workspace_users(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_park_status_date ON tasks(park_id, status, planned_date);
CREATE INDEX IF NOT EXISTS idx_tasks_open ON tasks(park_id, planned_date) WHERE status IN ('draft', 'open', 'in_progress', 'blocked');

CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  owner_type TEXT NOT NULL CHECK (owner_type IN ('task', 'park', 'import', 'export')),
  owner_id TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size >= 0),
  checksum TEXT NOT NULL,
  validation_summary TEXT NOT NULL DEFAULT '',
  uploaded_by TEXT NOT NULL REFERENCES workspace_users(id),
  uploaded_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_files_park_owner ON files(park_id, owner_type, owner_id);

CREATE TABLE IF NOT EXISTS exports (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL REFERENCES parks(id) ON DELETE CASCADE,
  export_type TEXT NOT NULL CHECK (export_type IN ('diagnosis_report', 'task_register', 'project_investment', 'evidence_catalog')),
  data_baseline_date TEXT,
  indicator_version TEXT,
  snapshot_json TEXT NOT NULL,
  snapshot_summary TEXT NOT NULL,
  r2_key TEXT,
  generated_by TEXT NOT NULL REFERENCES workspace_users(id),
  generated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_exports_park_type ON exports(park_id, export_type, generated_at DESC);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  park_id TEXT REFERENCES parks(id) ON DELETE SET NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('succeeded', 'failed')),
  summary TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_park_time ON audit_logs(park_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_time ON audit_logs(user_id, created_at DESC);

