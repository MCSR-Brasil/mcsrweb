# Backend Configuration

Main config file: `data/backend-config.json`

## Apps Script base URL

Set the Google Apps Script URL in one of these ways:

1. Environment variable `GAS_BASE_URL` (recommended)
2. `appsScript.baseUrl` in `data/backend-config.json`

## Actions

`appsScript.actions` maps logical names to your Apps Script action names:

- `runners`
- `rsg116`
- `ssg116`
- `ranked` (optional)
- `earnings` (optional)

Example:

```json
{
  "appsScript": {
    "baseUrl": "https://script.google.com/macros/s/XXXX/exec",
    "actions": {
      "runners": "getrunners",
      "rsg116": "getrsg116",
      "ssg116": "getssg116",
      "ranked": "getranked",
      "earnings": "getearnings"
    }
  }
}
```

## Tournament config summary

Tournament settings live in `pages.tournaments`:

- `defaultType`: default renderer (`default`, `ranking`, `event`, `custom`)
- `entries[]`: each tournament card/page
  - `slug`
  - `title` (used by index card)
  - `subtitle` (used by index card)
  - `description` (used by index card)
  - `url` (full endpoint for page content; can include custom action params)
  - `pageType` (selects which renderer component builds the tournament page)

Important split:

- Tournament index cards (`/tournaments`) use config metadata only.
- Tournament detail pages (`/tournaments/[slug]`) use fetched `url` content + `pageType` renderer.

Fallback CSV files are still used when backend data is unavailable for existing leaderboard/earnings flows:

- `data/earnings.csv`
- `data/uuid.csv`
- `data/runs.csv`
- `data/ranked.csv`
