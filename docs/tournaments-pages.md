# Tournament Pages Backend

Tournament pages are driven by `data/backend-config.json` entries.

- Card title/subtitle/description in `/tournaments` comes from config.
- The tournament detail page body comes from fetched `url` content and is rendered by `pageType` components.

## Modular docs by page type

- Default type: [`docs/tournaments-pages-default.md`](./tournaments-pages-default.md)
- SSG type: [`docs/tournaments-pages-ssg.md`](./tournaments-pages-ssg.md)

Each file contains:

- sheet/data layout contract
- JSON response example
- Google Apps Script example
- `backend-config.json` entry example
