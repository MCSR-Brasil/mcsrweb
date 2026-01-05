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
ADMIN_SECRET=
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

## Admin (secure)

Admin endpoints are protected by `ADMIN_SECRET`.

### UI

- Visit `http://localhost:3000/admin`
- Paste your `ADMIN_SECRET`

### API

Send the secret via header:

- `Authorization: Bearer <ADMIN_SECRET>`

Endpoints:

- `POST /api/admin/players`
- `POST /api/admin/pb-runs`
- `POST /api/admin/tournaments`
