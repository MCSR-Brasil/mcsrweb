PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS tournament_results;
DROP TABLE IF EXISTS tournaments;

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  starts_at TEXT NOT NULL,
  ends_at TEXT,
  participants_csv TEXT,
  type TEXT NOT NULL,
  bracket_format TEXT,
  losers_bracket_starts_round INTEGER,
  prizepool TEXT,
  winner TEXT,
  bracket_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tournaments_starts_at ON tournaments(starts_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_ends_at ON tournaments(ends_at);
CREATE INDEX IF NOT EXISTS idx_tournaments_type ON tournaments(type);
