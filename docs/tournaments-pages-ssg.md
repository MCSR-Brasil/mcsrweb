# Tournament Pages Backend - SSG Type

Use this doc when a tournament entry has:

```json
{
  "pageType": "ssg"
}
```

## Sheet/layout contract

For `pageType: "ssg"`, the endpoint configured in each tournament `url` should return table-like rows where:

- `A1` = title
- `A2` = description
- `A3` and `A4` = links (markdown hyperlink format)
  - Example: `[Bracket](https://challonge.com/example)`
- Row 5 contains board headers across columns (each board starts a 4-column block):
  - `A5` = `Main`
  - `E5` = `Seed1`
  - `I5` = `Seed2`
  - `M5` = `Seed3`
  - ... and so on
- Results start at row 6 and go down. For each board block:
  - `+0` col = player name
  - `+1` col = UUID
  - `+2` col = time
  - `+3` col = VOD link (plain URL or markdown link)

So for `Main` (`A:D`) and `Seed1` (`E:H`):

- `A6/B6/C6/D6` = Main place #1
- `A7/B7/C7/D7` = Main place #2
- `E6/F6/G6/H6` = Seed1 place #1
- `E7/F7/G7/H7` = Seed1 place #2

The UI shows:

- board selector input (Main, Seed1, Seed2...)
- leaderboard cards for selected board
- side mini-rankings listing top places per board

## Endpoint response shape

The app accepts JSON with one of these keys: `rows`, `values`, `data`, or `runs`.

Each should be an array-of-arrays.

SSG response example:

```json
{
  "rows": [
    ["Evento Bepe Zeeds"],
    ["Evento de SSG com seeds diferenciadas, melhores tempos ganham."],
    ["[Main VOD](https://youtube.com/watch?v=example1)"],
    ["[Playlist](https://youtube.com/playlist?list=example2)"],
    ["Main", "", "", "", "Seed1", "", "", "", "Seed2"],
    ["Mainfirst", "uuid-main-1", "12:34", "https://youtube.com/watch?v=main1", "Seed1first", "uuid-seed1-1", "10:40", "https://youtube.com/watch?v=s11", "Seed2first", "uuid-seed2-1", "11:01", "https://youtube.com/watch?v=s21"],
    ["Mainsecond", "uuid-main-2", "12:51", "https://youtube.com/watch?v=main2", "Seed1second", "uuid-seed1-2", "10:59", "https://youtube.com/watch?v=s12", "Seed2second", "uuid-seed2-2", "11:32", "https://youtube.com/watch?v=s22"]
  ]
}
```

## Google Apps Script example (`gettournamentssg`)

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

  if (action === "gettournamentssg") {
    return getTournamentSsg(e);
  }

  // default action for quick testing
  return getTournamentSsg(e);
}

function getTournamentSsg(e) {
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

  // A1 title, A2 description, A3 link1, A4 link2
  // Row 5 has board labels (Main, Seed1, Seed2...) across columns
  // Row 6+ results in 4-column groups: name, uuid, time, link
  var values = tournaments.getRange(1, 1, lastRow, Math.max(12, lastCol)).getValues();
  var rows = [];

  // Keep first 4 rows in single-column shape for parser compatibility.
  rows.push([String(values[0] && values[0][0] || "").trim()]);
  rows.push([String(values[1] && values[1][0] || "").trim()]);
  rows.push([String(values[2] && values[2][0] || "").trim()]);
  rows.push([String(values[3] && values[3][0] || "").trim()]);

  // Push full header row for board starts (row 5).
  var header = [];
  for (var c = 0; c < values[4].length; c++) {
    header.push(String(values[4][c] || "").trim());
  }
  rows.push(header);

  // Push result rows as-is; parser will split by board blocks.
  for (var r = 5; r < values.length; r++) {
    var outRow = [];
    var hasAny = false;
    for (var cc = 0; cc < values[r].length; cc++) {
      var cell = String(values[r][cc] || "").trim();
      outRow.push(cell);
      if (cell) hasAny = true;
    }
    if (!hasAny) continue;
    rows.push(outRow);
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
  "slug": "bepe-zeeds",
  "title": "Evento Bepe Zeeds",
  "subtitle": "Scout And Route",
  "description": "Evento de SSG com seeds diferenciadas, melhores tempos ganham.",
  "url": "https://script.google.com/macros/s/XXXX/exec?action=gettournamentssg",
  "pageType": "ssg"
}
```
