import { afterEach, describe, expect, it, vi } from "vitest";
import { EvandApiError, EvandClient, parseEventSlug } from "../src/evand.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const cityFixture = {
  data: [
    { id: 87, name: "تهران", slug: "تهران", events_count: 95, province: { data: { name: "تهران", slug: "تهران" } } },
    { id: 130, name: "مشهد", slug: "مشهد", events_count: 17, province: { data: { name: "خراسان رضوی", slug: "خراسان-رضوی" } } },
  ],
};

const categoryFixture = {
  data: [
    {
      id: 1,
      parent_id: 0,
      title: "تکنولوژی",
      slug: "تکنولوژی",
      events_count: 5,
      children: {
        data: [
          { id: 311, parent_id: 1, title: "هوش مصنوعی", slug: "هوش مصنوعی", events_count: 3 },
        ],
      },
    },
  ],
};

const eventFixture = {
  id: 25024740,
  name: "آیا DevOps بدون دخالت انسان هم می‌تواند کار کند؟",
  slug: "devops-w8",
  start_date: "2026-11-10T19:00:00+0330",
  end_date: "2026-11-10T21:00:00+0330",
  online: "yes",
  address: null,
  latitude: 0,
  longitude: 0,
  is_free: true,
  prices: { data: { min: 0, max: 0 } },
  city_name: "",
  ended: false,
  soldout: false,
  cancelled: false,
  published: "yes",
  timing_status: "future",
  refund_policy: "<p>Refund <strong>policy</strong></p>",
  category: {
    data: {
      id: 174,
      title: "آموزش",
      slug: "آموزش-1",
      parent: { data: { id: 1, title: "تکنولوژی", slug: "تکنولوژی" } },
    },
  },
  type: { data: { title: "رویداد", slug: "رویداد" } },
  tags: { data: [{ id: 1, name: "DevOps" }] },
  organization: {
    data: {
      id: "jrql3",
      name: "ابرها",
      slug: "abrha",
      logo: { original: "https://static.evand.net/logo.png" },
      description: "<p>Community</p>",
      followers_count: 3981,
      events_count: 36,
      socials: { website: "https://parspack.com", twitter: "undefined" },
    },
  },
  tickets: {
    data: [
      {
        id: 1,
        title: "Free ticket",
        type: "normal",
        price: 0,
        available_count: 10,
        capacity: 100,
        min_count: 1,
        max_count: 2,
        active: "yes",
        showtime_id: 7,
        description: "<p>Online</p>",
      },
      {
        id: 2,
        title: "Inactive ticket",
        price: 100,
        active: "no",
      },
    ],
  },
  showtimes: {
    data: [
      {
        id: 7,
        label: "سانس یک",
        start_date: "2026-11-10T19:00:00+0330",
        end_date: "2026-11-10T21:00:00+0330",
        has_purchasable_ticket: true,
      },
    ],
  },
  circles: [{ slug: "abrha", name: "abrha" }],
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("parseEventSlug", () => {
  it("accepts slugs, relative paths and full URLs", () => {
    expect(parseEventSlug("devops-w8")).toBe("devops-w8");
    expect(parseEventSlug("/events/devops-w8")).toBe("devops-w8");
    expect(parseEventSlug("events/devops-w8/")).toBe("devops-w8");
    expect(parseEventSlug("https://evand.com/events/devops-w8")).toBe("devops-w8");
    expect(parseEventSlug("https://www.evand.com/events/devops-w8/?utm=x")).toBe("devops-w8");
    expect(parseEventSlug("https://evand.com/events/%D8%B3%D8%A7%D8%AE%D8%AA-%D8%AF%D8%B3%D8%AA%D8%A7%D8%B1")).toBe(
      "ساخت-دستار",
    );
  });

  it("rejects other hosts and non-event pages", () => {
    expect(() => parseEventSlug("https://example.com/events/x")).toThrow(/evand\.com/);
    expect(() => parseEventSlug("https://evand.com/organizations/x")).toThrow(/event page/);
    expect(() => parseEventSlug("   ")).toThrow(/required/);
  });
});

describe("EvandClient.searchEvents", () => {
  it("resolves names to slugs and maps API results", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/cities") return json(cityFixture);
      if (url.pathname === "/categories") return json(categoryFixture);
      if (url.pathname === "/v2/events") {
        return json({
          data: [
            {
              id: 1,
              name: "Event",
              slug: "event",
              city_name: "تهران",
              online: "no",
              start_date: "2026-11-10T19:00:00+0330",
              end_date: "2026-11-10T21:00:00+0330",
              minimum_ticket_price: 100000,
              maximum_ticket_price: 200000,
              ended: false,
              soldout: false,
            },
          ],
          meta: { pagination: { total: 1, count: 1, per_page: 2, current_page: 1, total_pages: 1 } },
        });
      }
      return json({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new EvandClient();
    const result = await client.searchEvents({
      query: "هوش",
      city: "tehran",
      category: "ai",
      online: true,
      sort: "trending",
      start_date_from: "2026-11-01",
      start_date_to: "2026-11-30",
      min_price: 0,
      max_price: 500000,
      per_page: 2,
    });

    expect(result.filters.city).toEqual({ name: "تهران", slug: "تهران" });
    expect(result.filters.category).toMatchObject({ title: "هوش مصنوعی", slug: "هوش مصنوعی" });
    expect(result.events[0]?.price.display).toBe("100,000 – 200,000 Toman");
    expect(result.pagination.has_more).toBe(false);

    const apiCall = fetchMock.mock.calls.find(([input]) => String(input).includes("/v2/events"));
    expect(apiCall).toBeTruthy();
    const apiUrl = new URL(String(apiCall?.[0]));
    expect(apiUrl.searchParams.get("cities")).toBe("تهران");
    expect(apiUrl.searchParams.get("categories")).toBe("هوش مصنوعی");
    expect(apiUrl.searchParams.get("online")).toBe("yes");
    expect(apiUrl.searchParams.get("sort")).toBe("trending");
    expect(apiUrl.searchParams.get("min_start_date")).toBe("2026-11-01");
    expect(apiUrl.searchParams.get("max_start_date")).toBe("2026-11-30");
    expect(apiUrl.searchParams.get("min_price")).toBe("0");
    expect(apiUrl.searchParams.get("max_price")).toBe("500000");
    expect(apiUrl.searchParams.get("per_page")).toBe("2");
    expect(apiUrl.searchParams.get("q")).toBe("هوش");
  });

  it("rejects unknown cities with suggestions", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(cityFixture)));
    const client = new EvandClient();

    await expect(client.searchEvents({ city: "atlantis" })).rejects.toThrow(
      /City "atlantis" was not found.*تهران.*tehran/s,
    );
  });

  it("omits the sort parameter for nearest and validates dates", async () => {
    const fetchMock = vi.fn(async () => json({ data: [], meta: {} }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new EvandClient();

    await client.searchEvents({ online: false });
    const url = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(url.searchParams.has("sort")).toBe(false);
    expect(url.searchParams.get("online")).toBe("no");

    await expect(client.searchEvents({ start_date_from: "2026-02-30" })).rejects.toThrow(
      /real calendar date/,
    );
  });
});

describe("EvandClient.getEvent", () => {
  it("normalizes tickets, showtimes, category and description", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/events/devops-w8") return json({ data: eventFixture });
      if (url.pathname === "/events/devops-w8/description") {
        return json({
          data: [
            { type: "description", title: "About", description: "<p>Hello <b>world</b></p>" },
            { type: "speakers", title: "Speaker", content: [{ name: "Ali", position: "Engineer" }] },
          ],
        });
      }
      return json({ message: "not found" }, 404);
    });
    vi.stubGlobal("fetch", fetchMock);

    const client = new EvandClient();
    const event = await client.getEvent("devops-w8");

    expect(event.slug).toBe("devops-w8");
    expect(event.category?.path).toEqual(["تکنولوژی", "آموزش"]);
    expect(event.tags).toEqual(["DevOps"]);
    expect(event.refund_policy).toBe("Refund policy");
    expect(event.tickets).toHaveLength(1);
    expect(event.tickets[0]?.price_display).toBe("Free");
    expect(event.ticket_summary.sold_out).toBe(false);
    expect(event.showtimes[0]?.start_date_tehran).toBe("2026-11-10 19:00");
    expect(event.organization?.socials).toEqual({ website: "https://parspack.com" });
    expect(event.description?.text).toContain("About");
    expect(event.description?.text).toContain("Hello world");
    expect(event.description?.text).toContain("Ali — Engineer");
    expect(event.description?.sections[0]).toMatchObject({ type: "description", title: "About" });
    expect(event.registration_url).toBe("https://evand.com/events/devops-w8");
  });

  it("skips the description request when disabled", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.pathname === "/events/devops-w8") return json({ data: eventFixture });
      throw new Error(`unexpected request ${url.pathname}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    const event = await new EvandClient().getEvent("devops-w8", { includeDescription: false });
    expect(event.description).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns a friendly 404 for unknown events", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json({ message: "not found" }, 404)));

    await expect(new EvandClient().getEvent("nope")).rejects.toThrow(
      /Event "nope" was not found on Evand/,
    );
  });
});

describe("EvandApiError", () => {
  it("keeps the HTTP status", () => {
    expect(new EvandApiError("x", 404).status).toBe(404);
  });
});
