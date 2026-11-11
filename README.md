# evand-mcp

An unofficial [Model Context Protocol](https://modelcontextprotocol.io) server for **[Evand (ایوند)](https://evand.com/)** — the Iranian platform for discovering events, webinars, conferences, workshops and courses.

![Cover.png](./assets/cover.png)

It exposes Evand's public event data as read-only MCP tools, so assistants such as Claude, Cursor, VS Code Copilot and other MCP clients can search events, inspect ticket prices and availability, read descriptions, and find organizers. Purchases always happen on evand.com.

> **Unofficial project.** Not affiliated with or endorsed by Evand. It uses the same public, unauthenticated API endpoints as the evand.com website. Those endpoints are undocumented and may change or rate-limit requests at any time.

## Features

- Search upcoming events in Persian or English, with filters for city, category, online/in-person, price range, start date and sort order.
- Search the archive of past events (`include_past: true`).
- Get full event details: description, speakers, schedule/showtimes, tickets with remaining capacity, prices, venue and map coordinates, organizer, category, tags and refund policy.
- Get Evand's recommended similar events.
- Discover the exact city and category slugs used by Evand, including a resolver for common English aliases (`tehran`, `isfahan`, `technology`, `ai`, `fintech`, …).
- Find and inspect event organizers and their upcoming or past events.
- No API key, login, cookie or scraping required.
- Built-in retries, timeouts and a 10-minute cache for city/category metadata.

All prices are in **Iranian Toman**. All dates are rendered in **Asia/Tehran** time. Event names and descriptions remain in their original Persian.

## Tools

| Tool | Purpose | Key arguments |
| --- | --- | --- |
| `search_events` | Search public events. Returns compact event cards and pagination. | `query`, `city`, `category`, `online`, `include_past`, `min_price`, `max_price`, `start_date_from`, `start_date_to`, `sort`, `page`, `per_page` |
| `get_event` | Full details for one event, including description, tickets and showtimes. | `slug` (slug or URL), `include_description`, `max_description_chars` |
| `get_similar_events` | Events recommended by Evand as similar to a given event. | `slug`, `limit` |
| `list_cities` | Cities with events, event counts and province names. | `query`, `limit`, `include_empty` |
| `list_categories` | Top-level and child categories with slugs and parents. | `query`, `limit` |
| `search_organizations` | Find event organizers by name. | `query`, `sort`, `page`, `per_page` |
| `get_organization` | Organizer profile plus their upcoming or archived events. | `slug`, `include_events`, `events_limit`, `include_past_events`, `max_description_chars` |

### Filter resolution

`city` and `category` accept a Persian name, a Persian slug, or a common English alias. The server resolves them against Evand's live metadata before calling the events API:

```text
city: "tehran"      -> cities=تهران
city: "اصفهان"      -> cities=اصفهان
city: "tehran,karaj" -> cities=تهران,کرج
category: "AI"      -> categories=هوش مصنوعی
category: "fintech" -> categories=فین-تک
category: "مالی"    -> categories=مالی
```

If a name cannot be resolved, the tool returns an error with nearby suggestions instead of silently returning irrelevant events. Use `list_cities` or `list_categories` when in doubt.

### Sorting

| `sort` value | Meaning |
| --- | --- |
| `nearest` | Soonest first (default, same as Evand's «زمان») |
| `trending` | Evand's popular/trending ordering |
| `bestsellers` | Most tickets sold |
| `randomness` | Random order |
| `start_date` | Sorted by start date |

## Quick start

Requirements: **Node.js 20+** (Node 22/24 recommended) and npm.

```bash
git clone https://github.com/Hr-ArshA/evand-mcp.git
cd evand-mcp
npm install
npm run build
node dist/index.js
```

The server speaks MCP over **stdio**. A bare `node dist/index.js` waits for a client on stdin; it is not meant to be used interactively.

### Claude Code

```bash
claude mcp add evand -- node /absolute/path/to/evand-mcp/dist/index.js
```

### Claude Desktop

Add this to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "evand": {
      "command": "node",
      "args": ["/absolute/path/to/evand-mcp/dist/index.js"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json` (or `.cursor/mcp.json` in a project):

```json
{
  "mcpServers": {
    "evand": {
      "command": "node",
      "args": ["/absolute/path/to/evand-mcp/dist/index.js"]
    }
  }
}
```

### VS Code (MCP)

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "evand": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/evand-mcp/dist/index.js"]
    }
  }
}
```

### Other clients

Use `node /absolute/path/to/evand-mcp/dist/index.js` as a stdio MCP command.

To install from GitHub Packages (requires a GitHub token with `read:packages` in `~/.npmrc` for `@hr-arsha:registry=https://npm.pkg.github.com`):

```bash
npm install -g @hr-arsha/evand-mcp
```

Then run `evand-mcp` directly as the MCP command.

## Example prompts

- «رویدادهای هوش مصنوعی آنلاین هفته آینده را پیدا کن و قیمت بلیت‌هایشان را بگو.»
- "Find tech events in Tehran this month under 1,000,000 Toman and summarize the speakers."
- "Show me the details and remaining tickets for https://evand.com/events/devops-w8"
- "What events are similar to `creditfirst`?"
- "Which organizers in Iran have the most followers on Evand? Show their upcoming events."
- "List Evand's categories and the cities with the most events."

## Example calls and results

`search_events`:

```json
{
  "query": "هوش مصنوعی",
  "city": "tehran",
  "online": true,
  "start_date_from": "2026-11-10",
  "start_date_to": "2026-11-30",
  "sort": "nearest",
  "per_page": 5
}
```

returns:

```json
{
  "filters": {
    "query": "هوش مصنوعی",
    "city": { "name": "تهران", "slug": "تهران" },
    "online": true,
    "start_date": { "from": "2026-11-10", "to": "2026-11-30", "timezone": "Asia/Tehran" },
    "sort": "nearest"
  },
  "pagination": { "total": 44, "current_page": 1, "total_pages": 9, "has_more": true },
  "events": [
    {
      "id": 25024740,
      "name": "آیا DevOps بدون دخالت انسان هم می‌تواند کار کند؟",
      "slug": "devops-w8",
      "url": "https://evand.com/events/devops-w8",
      "start_date": "2026-11-10T19:00:00+03:30",
      "start_date_tehran": "2026-11-10 19:00",
      "online": true,
      "city": null,
      "organization": { "name": "ابرها", "slug": "abrha", "url": "https://evand.com/organizations/abrha" },
      "price": { "min": 0, "max": 0, "is_free": true, "currency": "Toman", "display": "Free" },
      "status": { "ended": false, "sold_out": false, "cancelled": false, "partnership": null }
    }
  ]
}
```

`get_event` accepts either `"devops-w8"` or `"https://evand.com/events/devops-w8"` and adds description sections, speakers, showtimes, ticket tiers and availability, map data, organizer details and refund policy.

> Availability and prices are a snapshot of Evand's public API. They can change before checkout; always confirm on the event page.

## Configuration

| Environment variable | Default | Description |
| --- | --- | --- |
| `EVAND_API_BASE_URL` | `https://api.evand.com` | Evand API base URL (useful for a proxy/mock) |
| `EVAND_WEB_BASE_URL` | `https://evand.com` | Base URL used to build human-facing event/org/city links |
| `EVAND_TIMEOUT_MS` | `20000` | Per-request timeout in milliseconds (clamped to 1000–60000) |
| `EVAND_MCP_DEBUG` | unset | Set to `1` to log retries and description failures to stderr |

MCP uses stdout for protocol messages, so **the server never writes logs to stdout**. Debug output goes to stderr.

## Development

```bash
npm install
npm run typecheck   # TypeScript, no emit
npm test            # unit tests (mocked fetch, no network)
npm run smoke       # live API smoke test (network)
npm run dev         # run the MCP server from TS sources
npm run build       # compile to dist/
```

The unit tests cover HTML-to-text conversion, date/price formatting, city/category resolution, URL/slug parsing, API query construction, error handling and event normalization. `npm run smoke` exercises every tool against the live service.

### How it works

```text
src/index.ts     stdio entry point
src/server.ts    MCP server + tool registration (Zod input schemas)
src/evand.ts     Evand API client, caching, retries, response normalization
src/resolver.ts  city/category aliases and matching
src/format.ts    HTML-to-text, Tehran time, Toman price formatting
```

The client talks to the public endpoints used by evand.com itself:

- `GET /v2/events` — search/list with `q`, `cities`, `categories`, `online`, `archive`, `min_price`, `max_price`, `min_start_date`, `max_start_date`, `sort`, `page`, `per_page`
- `GET /events/{slug}?include=…` — event detail
- `GET /events/{slug}/description` — structured description sections
- `GET /recommendation/events/{slug}/similar` — recommendations
- `GET /cities?include=province&sort=eventCount`
- `GET /categories?include=children&order=-1&sort=eventCount`
- `GET /organizations`, `GET /organizations/{slug}`
- `GET /v2/events?organization_id=…` — an organizer's events

No authentication is required for any of these reads.

## Limitations

- **Read-only:** you cannot buy tickets, log in, register, follow organizers or create events. Direct the user to the event's `registration_url`.
- **Unofficial API:** Evand may change endpoints, add rate limits or block automated clients without notice. The server includes retries, timeouts and polite metadata caching, but cannot guarantee availability.
- **Archive search:** with `include_past: true`, Evand's archive is very large and not always meaningfully ordered. Combine it with `query`, `city`, `category` or date filters.
- **Availability data:** ticket counts are public counters and may lag behind actual sales or reservations.
- **Persian content:** search and result quality is best in Persian. English aliases only resolve city/category filters; free-text `query` is sent to Evand as-is.
- **Descriptions can be long:** use `max_description_chars` to cap them (default 8,000).
- **No images in tool output by default:** cover/logo URLs are returned as links.

## Privacy and terms

The server sends only the search terms and filters you provide to `api.evand.com`. It stores no user data, requires no credentials and does not write to Evand. Metadata is cached in memory for 10 minutes per process. Please respect Evand's terms of service and avoid high-volume automated querying.

## License

MIT. See [LICENSE](LICENSE).
