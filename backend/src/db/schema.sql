-- ClimateTrust SQLite Schema

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  owner TEXT NOT NULL,
  methodology TEXT NOT NULL,
  geojson TEXT NOT NULL,
  area_ha REAL NOT NULL,
  pdd_hash TEXT NOT NULL,
  hfs_file_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('DRAFT', 'ANALYZED', 'LISTED', 'SOLD_OUT')),
  token_id TEXT,
  total_tonnage INTEGER,
  price_per_tonne_usd REAL NOT NULL DEFAULT 25.0,
  ndvi_mean REAL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  ndvi_mean REAL NOT NULL,
  ndvi_series TEXT NOT NULL,
  biomass_t_ha REAL NOT NULL,
  tco2e REAL NOT NULL,
  report_hash TEXT NOT NULL,
  cloud_cover_pct REAL NOT NULL,
  source TEXT NOT NULL,
  hcs_seq INTEGER,
  hcs_tx_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audits (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL UNIQUE,
  auditor_id TEXT NOT NULL,
  report_hash TEXT NOT NULL,
  gross_tco2e REAL NOT NULL,
  buffer_pct REAL NOT NULL,
  net_tonnage INTEGER NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVED', 'REJECTED')),
  notes TEXT,
  vc_json TEXT NOT NULL,
  hcs_seq INTEGER,
  hcs_tx_id TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_serials (
  token_id TEXT NOT NULL,
  serial INTEGER NOT NULL,
  project_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'LOCKED', 'RETIRED')),
  order_id TEXT,
  locked_at TEXT,
  PRIMARY KEY (token_id, serial),
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_serials_project_status ON project_serials(project_id, status);
CREATE INDEX IF NOT EXISTS idx_serials_order ON project_serials(order_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  buyer_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  total_usd REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('LOCKED', 'RETIRED', 'EXPIRED')),
  expires_at TEXT NOT NULL,
  wipe_tx_id TEXT,
  hcs_seq INTEGER,
  hcs_tx_id TEXT,
  certificate_url TEXT,
  created_at TEXT NOT NULL,
  paid_at TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE TABLE IF NOT EXISTS order_serials (
  order_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  serial INTEGER NOT NULL,
  PRIMARY KEY (order_id, token_id, serial),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS actors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('BUYER', 'AUDITOR', 'DEVELOPER')),
  hedera_account_id TEXT NOT NULL,
  did TEXT NOT NULL
);
