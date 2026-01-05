# MCSR BR — Minecraft Speedrunning Brasil

Community hub for leaderboards, tournaments, and player stats.

## Local development

```bash
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

## Database (Turso / libSQL)

This project uses Turso as the primary database (with mock/local fallbacks so the site can run without a DB).

### Environment variables

Set these in your `.env.local`:

```
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

### Schema

Schema lives in:

- `db/001_init.sql`

Apply it with the Turso CLI:

```bash
turso db shell <YOUR_DB_NAME> < db/001_init.sql
```

More details:

- `db/README.md`
