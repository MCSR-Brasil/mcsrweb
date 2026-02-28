# Tournament Pages Backend - Default Type

Use this doc when a tournament entry has:

```json
{
  "pageType": "default"
}
```

## Sheet/layout contract

For `pageType: "default"`, the endpoint configured in each tournament `url` should return table-like rows where:

- `A1` = title card
- `A2` = description
- `A3` and `A4` = links (markdown hyperlink format)
  - Example: `[Bracket](https://challonge.com/example)`
- Results start at row 5 and go down:
  - `A` = player name
  - `B` = UUID
  - `C` = prize

So:

- `A5/B5/C5` = result #1 (`name`, `uuid`, `prize`)
- `A6/B6/C6` = result #2
- `A7/B7/C7` = result #3
- ... and so on.

## Endpoint response shape

The app accepts JSON with one of these keys: `rows`, `values`, `data`, or `runs`.

Each should be an array-of-arrays.

Example response:

```json
{
  "rows": [
    ["MCSR BR Cup #1"],
    ["Evento principal da temporada."],
    ["[Bracket](https://challonge.com/mcsrbrcup1)"],
    ["[VOD](https://youtube.com/playlist?list=PLxxx)"],
    ["darkk575", "31bb6401944d4fc5ad97f6cf90c54616", "R$ 2.000"],
    ["subdas", "0562802e736e47c581b2ef095e2ed067", "R$ 1.000"]
  ]
}
```

## Google Apps Script example (`gettournamentdefault`)

```javascript
var SPREADSHEET_ID = "PUT_YOUR_SPREADSHEET_ID_HERE";
var TOURNAMENTS_SHEET_NAME = "tournaments";

function getTournamentsSheet() {
  // In Web App deployments, getActiveSpreadsheet() may be null.
  if (SPREADSHEET_ID && SPREADSHEET_ID !== "PUT_YOUR_SPREADSHEET_ID_HERE") {
    return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TOURNAMENTS_SHEET_NAME);
  }

  var active = SpreadsheetApp.getActiveSpreadsheet();
  return active ? active.getSheetByName(TOURNAMENTS_SHEET_NAME) : null;
}

function doGet(e) {
  var action = String((e && e.parameter && e.parameter.action) || "").toLowerCase();

  if (action === "gettournamentdefault") {
    return getTournamentDefault(e);
  }

  // default action for quick testing
  return getTournamentDefault(e);
}

function getTournamentDefault(e) {
  var tournaments = getTournamentsSheet();
  if (!tournaments) {
    return jsonOut({
      status: "error",
      message: "Sheet not found. Check SPREADSHEET_ID and TOURNAMENTS_SHEET_NAME.",
      rows: []
    });
  }

  var lastRow = tournaments.getLastRow();
  var lastCol = tournaments.getLastColumn();
  if (lastRow < 1 || lastCol < 1) {
    return jsonOut({ rows: [] });
  }

  // A1 title, A2 description, A3 link1, A4 link2, then results from row 5:
  // A=name, B=uuid, C=prize
  var values = tournaments.getRange(1, 1, lastRow, Math.max(3, lastCol)).getValues();
  var rows = [];

  // Keep first 4 rows in single-column shape for parser compatibility.
  rows.push([String(values[0] && values[0][0] || "").trim()]);
  rows.push([String(values[1] && values[1][0] || "").trim()]);
  rows.push([String(values[2] && values[2][0] || "").trim()]);
  rows.push([String(values[3] && values[3][0] || "").trim()]);

  for (var i = 4; i < values.length; i++) {
    var name = String(values[i][0] || "").trim();
    var uuid = String(values[i][1] || "").trim();
    var prize = String(values[i][2] || "").trim();

    if (!name && !uuid && !prize) continue;
    rows.push([name, uuid, prize]);
  }

  return jsonOut({ rows: rows });
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Config example

```json
{
  "slug": "mcsr-br-cup-1",
  "title": "MCSR BR Cup #1",
  "subtitle": "Main Event",
  "description": "Campeonato principal com partidas eliminatórias.",
  "url": "https://script.google.com/macros/s/XXXX/exec?action=gettournamentdefault",
  "pageType": "default"
}
```
