PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS players (
  uuid TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_norm TEXT GENERATED ALWAYS AS (lower(trim(name))) STORED,
  state_uf TEXT,
  country_code TEXT DEFAULT 'BR',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_players_name_norm ON players(name_norm);
CREATE INDEX IF NOT EXISTS idx_players_state_uf ON players(state_uf);

CREATE TABLE IF NOT EXISTS pb_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_uuid TEXT NOT NULL,
  category TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  achieved_at TEXT,
  link TEXT,
  description TEXT,
  seed TEXT,
  bastion TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (player_uuid) REFERENCES players(uuid) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_pb_runs_player_category_time ON pb_runs(player_uuid, category, time_ms);
CREATE INDEX IF NOT EXISTS idx_pb_runs_category_time ON pb_runs(category, time_ms);

CREATE VIEW IF NOT EXISTS v_player_best_runs AS
SELECT
  player_uuid,
  category,
  time_ms,
  achieved_at,
  link,
  description,
  seed,
  bastion
FROM (
  SELECT
    r.*, 
    row_number() OVER (
      PARTITION BY r.player_uuid, r.category
      ORDER BY r.time_ms ASC, coalesce(r.achieved_at, '') ASC, r.id ASC
    ) AS rn
  FROM pb_runs r
)
WHERE rn = 1;

CREATE VIEW IF NOT EXISTS v_leaderboard_runs AS
SELECT
  p.name AS name,
  p.state_uf AS state_uf,
  b.category AS category,
  b.time_ms AS time_ms,
  b.achieved_at AS achieved_at,
  b.link AS link
FROM v_player_best_runs b
JOIN players p ON p.uuid = b.player_uuid;

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT NOT NULL,
  prizepool TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tournaments_ends_at ON tournaments(ends_at);

CREATE TABLE IF NOT EXISTS tournament_results (
  tournament_id TEXT NOT NULL,
  placement INTEGER NOT NULL,
  player_uuid TEXT NOT NULL,
  prize TEXT,
  points INTEGER,
  pb_run_id INTEGER,
  PRIMARY KEY (tournament_id, placement),
  FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE,
  FOREIGN KEY (player_uuid) REFERENCES players(uuid) ON DELETE CASCADE,
  FOREIGN KEY (pb_run_id) REFERENCES pb_runs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tournament_results_player ON tournament_results(player_uuid);
