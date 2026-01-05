# Database (Turso / SQLite)

This project uses Turso (libSQL) as the primary database.

## Required environment variables

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN` (optional for local SQLite / not required depending on your setup)

## Schema / migrations

- `db/001_init.sql` contains the full schema.

Apply it to your database using the Turso CLI:

```bash
turso db shell <YOUR_DB_NAME> < db/001_init.sql
```

If you prefer, you can copy/paste the SQL in the Turso shell.

## Tables overview

- `players`: canonical players table (future profiles)
- `pb_runs`: player PBs (time/category/date/link/seed/bastion/etc)
- `ranked_scores`, `rsg_scores`: snapshot score tables
- `tournaments`, `tournament_results`

## Compatibility views

To keep the app repositories simple, views are provided:

- `leaderboard_ranked` (name/value/state_uf)
- `leaderboard_rsg` (name/value/state_uf)
- `v_player_best_runs` (best PB per player+category)
