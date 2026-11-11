import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { EvandClient, parseEventSlug } from "./evand.js";

const SERVER_NAME = "evand-mcp";
const SERVER_VERSION = "0.1.0";

const READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

function jsonResult(payload: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

function errorResult(error: unknown): CallToolResult {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [
      {
        type: "text",
        text: JSON.stringify({ error: message }),
      },
    ],
  };
}

async function safely<T>(operation: () => Promise<T>): Promise<CallToolResult> {
  try {
    return jsonResult(await operation());
  } catch (error) {
    return errorResult(error);
  }
}

const SERVER_INSTRUCTIONS = `Evand (evand.com) is an Iranian event discovery and ticketing platform.
Use this server to find public events, read event details, prices, tickets, organizers, cities and categories.

Guidance:
- Start with search_events. Persian and English search terms both work, but Evand content is mostly Persian, so Persian queries usually return better results.
- Filter by city/category with names or slugs. Unsure of a name? Call list_cities or list_categories first; common English aliases (Tehran, Isfahan, technology, AI, ...) are resolved automatically.
- Event slugs come from search results or from evand.com/events/<slug> URLs. get_event accepts either.
- Dates and times are in Asia/Tehran. Prices are in Iranian Toman. "Free" means no ticket price.
- Ticket purchase, login and registration are not supported by this server. Give the user the event URL / registration_url and let them complete the purchase on evand.com.

This server is read-only and uses Evand's public website API, which is undocumented and may change.`;

export function createServer(client: EvandClient = new EvandClient()): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      instructions: SERVER_INSTRUCTIONS,
      capabilities: { tools: {} },
    },
  );

  server.registerTool(
    "search_events",
    {
      title: "Search Evand events",
      description:
        "Search upcoming public events on Evand (evand.com) by Persian/English keyword, city, category, online status, price and start date. Returns compact event cards with slugs and URLs plus pagination. Set include_past=true to search Evand's archive of past events. If a city or category is rejected, call list_cities or list_categories to discover the accepted names/slugs.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .optional()
          .describe("Free-text search, e.g. 'هوش مصنوعی', 'برنامه نویسی', 'startup', 'DevOps'."),
        city: z
          .string()
          .optional()
          .describe("City name or slug, e.g. 'تهران', 'tehran', 'اصفهان'. Multiple cities can be comma-separated."),
        category: z
          .string()
          .optional()
          .describe("Category name or slug, e.g. 'تکنولوژی', 'technology', 'هوش مصنوعی', 'ai', 'فین-تک'."),
        online: z
          .boolean()
          .optional()
          .describe(
            "true = only online/webinar events; false = only in-person events; omit = both.",
          ),
        include_past: z
          .boolean()
          .optional()
          .describe("Search archived (past) events instead of upcoming events. Default false."),
        min_price: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Minimum ticket price in Iranian Toman (inclusive). 0 includes free events."),
        max_price: z
          .number()
          .int()
          .min(0)
          .optional()
          .describe("Maximum ticket price in Iranian Toman (inclusive)."),
        start_date_from: z
          .string()
          .optional()
          .describe("Earliest event start date, inclusive, as YYYY-MM-DD in Tehran time (Gregorian)."),
        start_date_to: z
          .string()
          .optional()
          .describe("Latest event start date, inclusive, as YYYY-MM-DD in Tehran time (Gregorian)."),
        sort: z
          .enum(["nearest", "trending", "bestsellers", "randomness", "start_date"])
          .optional()
          .describe(
            "nearest = soonest first (default, same as Evand's 'زمان'); trending = most popular; bestsellers = most tickets sold; randomness = random; start_date = start date ascending.",
          ),
        page: z.number().int().min(1).max(1000).optional().describe("Page number, starting at 1. Default 1."),
        per_page: z
          .number()
          .int()
          .min(1)
          .max(50)
          .optional()
          .describe("Results per page, 1-50. Default 12 (Evand's page size)."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "Search Evand events",
      },
    },
    async (args) =>
      safely(() =>
        client.searchEvents({
          query: args.query,
          city: args.city,
          category: args.category,
          online: args.online,
          include_past: args.include_past,
          min_price: args.min_price,
          max_price: args.max_price,
          start_date_from: args.start_date_from,
          start_date_to: args.start_date_to,
          sort: args.sort,
          page: args.page,
          per_page: args.per_page,
        }),
      ),
  );

  server.registerTool(
    "get_event",
    {
      title: "Get Evand event details",
      description:
        "Get full public details for a single Evand event: description, speakers/organizers, schedule/showtimes, tickets and remaining capacity, price, venue/location, organizer, categories, tags and refund policy. Accepts an event slug (from search_events) or a full https://evand.com/events/<slug> URL. Use include_description=false for a smaller response.",
      inputSchema: {
        slug: z
          .string()
          .min(1)
          .describe("Event slug (e.g. 'devops-w8') or full Evand event URL."),
        include_description: z
          .boolean()
          .optional()
          .describe("Include the long description (sections, speakers). Default true."),
        max_description_chars: z
          .number()
          .int()
          .min(0)
          .max(40_000)
          .optional()
          .describe("Maximum characters of description text to return, 0-40000. Default 8000. Set 0 to skip."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "Get Evand event details",
      },
    },
    async (args) =>
      safely(async () =>
        client.getEvent(parseEventSlug(args.slug), {
          includeDescription: args.include_description,
          maxDescriptionChars: args.max_description_chars,
        }),
      ),
  );

  server.registerTool(
    "get_similar_events",
    {
      title: "Get similar Evand events",
      description:
        "Get Evand's recommendations for events similar to a given event. Useful for 'what else is like this?' follow-ups. Accepts a slug or full Evand event URL.",
      inputSchema: {
        slug: z.string().min(1).describe("Event slug or full Evand event URL."),
        limit: z.number().int().min(1).max(12).optional().describe("Number of similar events, 1-12. Default 6."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "Get similar Evand events",
      },
    },
    async (args) =>
      safely(async () => {
        const slug = parseEventSlug(args.slug);
        return { source_slug: slug, events: await client.getSimilarEvents(slug, args.limit ?? 6) };
      }),
  );

  server.registerTool(
    "list_cities",
    {
      title: "List Evand cities",
      description:
        "List Iranian cities that have events on Evand, with event counts and the slug to pass to search_events. Results are sorted by event count. Use this when a city filter is ambiguous or you need the exact spelling.",
      inputSchema: {
        query: z.string().optional().describe("Optional case-insensitive filter on city/province name."),
        limit: z.number().int().min(1).max(100).optional().describe("Maximum cities to return, 1-100. Default 30."),
        include_empty: z
          .boolean()
          .optional()
          .describe("Include cities with no currently listed events. Default false."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "List Evand cities",
      },
    },
    async (args) =>
      safely(() => client.listCities(args.query, args.limit ?? 30, args.include_empty ?? false)),
  );

  server.registerTool(
    "list_categories",
    {
      title: "List Evand categories",
      description:
        "List Evand event categories and subcategories with their slugs, parent categories and event counts. Use the slug or title as the category filter in search_events.",
      inputSchema: {
        query: z.string().optional().describe("Optional case-insensitive filter on category title, slug or parent."),
        limit: z.number().int().min(1).max(300).optional().describe("Maximum categories to return, 1-300. Default 100."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "List Evand categories",
      },
    },
    async (args) => safely(() => client.listCategories(args.query, args.limit ?? 100)),
  );

  server.registerTool(
    "search_organizations",
    {
      title: "Search Evand organizers",
      description:
        "Search organizations that host events on Evand, by name. Returns follower/event counts and the organization slug. Sort by followers (default), bestsellers, or partnerships. Use get_organization for full details and their events.",
      inputSchema: {
        query: z.string().optional().describe("Organization name search, e.g. 'ابرها' or 'CS50'."),
        sort: z
          .enum(["followers", "bestsellers", "partnerships"])
          .optional()
          .describe("followers = most followed (default); bestsellers = most ticket sales; partnerships = Evand partners."),
        page: z.number().int().min(1).max(1000).optional().describe("Page number, default 1."),
        per_page: z.number().int().min(1).max(50).optional().describe("Results per page, 1-50. Default 12."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "Search Evand organizers",
      },
    },
    async (args) => safely(() => client.searchOrganizations(args)),
  );

  server.registerTool(
    "get_organization",
    {
      title: "Get Evand organizer",
      description:
        "Get an Evand organization's profile (bio, logo, social links, followers, event counts) and, by default, its current/upcoming events. Accepts an organization slug or full https://evand.com/organizations/<slug> URL. Set include_past_events=true to list archived events instead.",
      inputSchema: {
        slug: z.string().min(1).describe("Organization slug or full Evand organization URL."),
        include_events: z.boolean().optional().describe("Include the organization's events. Default true."),
        events_limit: z
          .number()
          .int()
          .min(1)
          .max(30)
          .optional()
          .describe("Maximum events to include, 1-30. Default 12."),
        include_past_events: z
          .boolean()
          .optional()
          .describe("Return archived/past events instead of upcoming events. Default false."),
        max_description_chars: z
          .number()
          .int()
          .min(0)
          .max(20_000)
          .optional()
          .describe("Maximum characters of organizer bio to return, 0-20000. Default 4000."),
      },
      annotations: {
        ...READ_ONLY_ANNOTATIONS,
        title: "Get Evand organizer",
      },
    },
    async (args) =>
      safely(async () =>
        client.getOrganization(parseOrganizationSlug(args.slug), {
          includeEvents: args.include_events,
          eventsLimit: args.events_limit,
          includePastEvents: args.include_past_events,
          maxDescriptionChars: args.max_description_chars,
        }),
      ),
  );

  return server;
}

/** Accepts an org slug or a full https://evand.com/organizations/<slug> URL. */
function parseOrganizationSlug(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("An organization slug or URL is required.");

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new Error(`"${input}" is not a valid URL.`);
    }
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "evand.com" && !hostname.endsWith(".evand.com")) {
      throw new Error(`Expected a URL on evand.com, got ${url.hostname}.`);
    }
    const match = url.pathname.match(/^\/organizations\/([^/]+)\/?$/);
    if (!match?.[1]) {
      throw new Error(`The URL does not point to an Evand organization page: ${input}`);
    }
    return decodeURIComponent(match[1]);
  }

  return decodeURIComponent(
    trimmed
      .replace(/^\/+/, "")
      .replace(/^organizations\//i, "")
      .replace(/\/+$/, ""),
  );
}
