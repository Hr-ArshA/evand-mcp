import {
  formatTehranDate,
  htmlToText,
  normalizeIsoDate,
  normalizePrice,
  truncateText,
  type NormalizedPrice,
} from "./format.js";
import {
  flattenCategories,
  resolveCategory,
  resolveCity,
  suggestCategories,
  suggestCities,
  type Category,
  type City,
  type FlatCategory,
} from "./resolver.js";

const DEFAULT_API_BASE = "https://api.evand.com";
const DEFAULT_WEB_BASE = "https://evand.com";
const DEFAULT_TIMEOUT_MS = 20_000;
const METADATA_TTL_MS = 10 * 60 * 1000;
const MAX_DESCRIPTION_CHARS = 40_000;
const EVENT_INCLUDES = [
  "tags",
  "type",
  "city",
  "prices",
  "category",
  "category.parent",
  "showtimes",
  "organization",
  "affiliate",
  "tickets",
] as const;

type QueryValue = string | number | boolean | null | undefined;

export interface Cover {
  original?: string | null;
  thumbnails?: unknown[];
  name?: string | null;
}

export interface OrganizationRef {
  id?: string | number | null;
  name?: string | null;
  slug?: string | null;
  logo?: Cover | string | null;
  cover?: Cover | string | null;
  description?: string | null;
  striped_description?: string | null;
  socials?: Record<string, string | null | undefined> | null;
  followers_count?: number | null;
  events_count?: number | null;
  active_events_count?: number | null;
  partnership?: { status?: string | null } | null;
}

export interface TicketApi {
  id: number;
  title?: string | null;
  type?: string | null;
  price?: number | null;
  min_price?: number | null;
  max_price?: number | null;
  available_count?: number | null;
  capacity?: number | null;
  min_count?: number | null;
  max_count?: number | null;
  active?: string | boolean | null;
  showtime_id?: number | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  login_required?: string | null;
  addons_total_price?: number | null;
}

export interface ShowtimeApi {
  id: number;
  label?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  has_purchasable_ticket?: boolean | null;
}

export interface EventListApi {
  id: number;
  name: string;
  slug: string;
  city_name?: string | null;
  city_id?: number | null;
  online?: string | boolean | null;
  cover?: Cover | string | null;
  start_date?: string | null;
  end_date?: string | null;
  address?: string | null;
  ended?: boolean | null;
  soldout?: boolean | null;
  cancelled?: boolean | null;
  partnership?: { status?: string | null } | null;
  organization?: { data?: OrganizationRef | null } | OrganizationRef | null;
  minimum_ticket_price?: number | null;
  maximum_ticket_price?: number | null;
  prices?: { data?: { min?: number | null; max?: number | null } | null } | null;
}

export interface EventDetailApi extends EventListApi {
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  socials?: Record<string, string | null | undefined> | null;
  refund_policy?: string | null;
  ticket_type?: string | null;
  timing_status?: string | null;
  published?: string | null;
  private?: string | null;
  is_free?: boolean | null;
  is_webinar_capacity_ended?: boolean | null;
  webinar_type?: string | null;
  duration?: { hours?: number; minutes?: number } | null;
  city?: { data?: City | null } | null;
  prices?: { data?: { min?: number | null; max?: number | null } | null } | null;
  category?: { data?: (Category & { parent?: { data?: Category | null } | null }) | null } | null;
  type?: { data?: { id?: number; title?: string | null; slug?: string | null } | null } | null;
  tags?: { data?: Array<{ id?: number; name?: string | null; slug?: string | null }> } | null;
  showtimes?: { data?: ShowtimeApi[] | null } | null;
  tickets?: { data?: TicketApi[] | null } | null;
  circles?: Array<{ slug?: string | null; name?: string | null; logo?: Cover | string | null }> | null;
}

export interface DescriptionApiItem {
  type?: string | null;
  title?: string | null;
  content?: unknown;
  description?: string | null;
}

export interface SimilarEventApi {
  id?: number | null;
  name?: string | null;
  slug?: string | null;
  city_name?: string | null;
  online?: string | boolean | null;
  organization_name?: string | null;
  organization_slug?: string | null;
  organization_logo?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  cover?: Cover | string | null;
  minimum_ticket_price?: number | null;
  maximum_ticket_price?: number | null;
}

export interface Pagination {
  total: number | null;
  count: number | null;
  per_page: number | null;
  current_page: number;
  total_pages: number | null;
  has_more: boolean;
}

export interface EventSummary {
  id: number | null;
  name: string;
  slug: string;
  url: string;
  start_date: string | null;
  end_date: string | null;
  start_date_tehran: string | null;
  end_date_tehran: string | null;
  online: boolean;
  city: string | null;
  address: string | null;
  organization: OrganizationCard | null;
  price: NormalizedPrice;
  status: {
    ended: boolean;
    sold_out: boolean;
    cancelled: boolean;
    partnership: string | null;
  };
  cover: string | null;
}

export interface OrganizationCard {
  name: string | null;
  slug: string | null;
  url: string | null;
  logo: string | null;
}

export interface EventTicket {
  id: number;
  title: string;
  type: string;
  price: number;
  price_display: string;
  available_count: number | null;
  capacity: number | null;
  min_count: number | null;
  max_count: number | null;
  active: boolean;
  showtime_id: number | null;
  sale_start: string | null;
  sale_end: string | null;
  description: string;
  login_required: boolean;
}

export interface EventShowtime {
  id: number;
  label: string;
  start_date: string | null;
  end_date: string | null;
  start_date_tehran: string | null;
  end_date_tehran: string | null;
  description: string;
  has_purchasable_ticket: boolean;
}

export interface DescriptionSection {
  type: string;
  title: string | null;
  text: string | null;
  items: Array<Record<string, string | null>> | null;
}

export interface EventDescription {
  text: string;
  sections: DescriptionSection[];
  truncated: boolean;
  error: string | null;
}

export interface EventDetail extends EventSummary {
  website: string | null;
  socials: Record<string, string>;
  category: {
    id: number;
    title: string;
    slug: string;
    path: string[];
  } | null;
  type: string | null;
  tags: string[];
  location: {
    online: boolean;
    city: string | null;
    city_slug: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    map_url: string | null;
  };
  showtimes: EventShowtime[];
  tickets: EventTicket[];
  ticket_summary: {
    active_tickets: number;
    available_tickets: number | null;
    min_price: number | null;
    max_price: number | null;
    sold_out: boolean;
  };
  organization: (OrganizationCard & {
    description: string | null;
    followers_count: number | null;
    events_count: number | null;
    socials: Record<string, string>;
  }) | null;
  circles: Array<{ name: string; slug: string; logo: string | null }>;
  timing_status: string | null;
  published: string | null;
  refund_policy: string | null;
  description: EventDescription | null;
  registration_url: string;
}

export interface SearchEventsInput {
  query?: string;
  city?: string;
  category?: string;
  online?: boolean;
  include_past?: boolean;
  min_price?: number;
  max_price?: number;
  start_date_from?: string;
  start_date_to?: string;
  sort?: "nearest" | "trending" | "bestsellers" | "randomness" | "start_date";
  page?: number;
  per_page?: number;
}

export interface SearchEventsResult {
  filters: {
    query: string | null;
    city: { name: string; slug: string } | null;
    category: { title: string; slug: string; parent: string | null } | null;
    online: boolean | null;
    include_past: boolean;
    price: { min: number | null; max: number | null; currency: "Toman" } | null;
    start_date: { from: string | null; to: string | null; timezone: "Asia/Tehran" } | null;
    sort: string;
  };
  pagination: Pagination;
  events: EventSummary[];
}

export interface OrganizationSummary {
  id: string | null;
  name: string;
  slug: string;
  url: string;
  logo: string | null;
  cover: string | null;
  description: string;
  followers_count: number | null;
  events_count: number | null;
  active_events_count: number | null;
  partnership: string | null;
  recommended_percent: number | null;
  socials: Record<string, string>;
}

export interface OrganizationDetail extends OrganizationSummary {
  events: EventSummary[];
}

export interface EventDescriptionOptions {
  includeDescription?: boolean;
  maxDescriptionChars?: number;
}

export class EvandApiError extends Error {
  public readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "EvandApiError";
    this.status = status;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function truthy(value: unknown): boolean {
  return value === true || value === "yes" || value === "true" || value === 1 || value === "1";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function coverUrl(value: Cover | string | null | undefined): string | null {
  if (!value) return null;
  if (typeof value === "string") return value || null;
  return value.original ?? null;
}

function pickRecord(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) return null;
  const data = asRecord(record.data);
  return data ?? record;
}

function joinUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function eventUrl(webBase: string, slug: string): string {
  return joinUrl(webBase, `events/${encodeURIComponent(slug)}`);
}

function organizationUrl(webBase: string, slug: string): string {
  return joinUrl(webBase, `organizations/${encodeURIComponent(slug)}`);
}

function normalizeSocials(raw: Record<string, unknown> | null | undefined): Record<string, string> {
  if (!raw) return {};
  const keyMap: Record<string, string> = {
    tel: "phone",
    phone: "phone",
    mobile: "phone",
    website: "website",
    instagram: "instagram",
    linkedin: "linkedin",
    twitter: "twitter",
    x: "twitter",
    facebook: "facebook",
    telegram: "telegram",
    telegram_channel: "telegram",
    telegramChannel: "telegram",
    youtube: "youtube",
    github: "github",
  };

  const socials: Record<string, string> = {};
  for (const [key, rawValue] of Object.entries(raw)) {
    const value = asString(rawValue);
    if (!value || value === "undefined" || value === "null") continue;
    const normalizedKey = keyMap[key] ?? key;
    socials[normalizedKey] = value;
  }
  return socials;
}

function normalizeOrganizationRef(value: unknown, webBase: string): OrganizationCard | null {
  const record = asRecord(value);
  if (!record) return null;
  const data = asRecord(record.data) ?? record;
  const name = asString(data.name);
  const slug = asString(data.slug);
  if (!name && !slug) return null;
  return {
    name,
    slug,
    url: slug ? organizationUrl(webBase, slug) : null,
    logo: coverUrl(data.logo as Cover | string | null | undefined),
  };
}

function parsePagination(meta: unknown): Pagination {
  const metaRecord = asRecord(meta);
  const pagination = asRecord(metaRecord?.pagination);
  const currentPage = asNumber(pagination?.current_page) ?? 1;
  const totalPages = asNumber(pagination?.total_pages);
  return {
    total: asNumber(pagination?.total),
    count: asNumber(pagination?.count),
    per_page: asNumber(pagination?.per_page),
    current_page: currentPage,
    total_pages: totalPages,
    has_more: totalPages !== null ? currentPage < totalPages : false,
  };
}

function parseEventDate(value: string | null | undefined, field: string): string | null {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new EvandApiError(`Invalid ${field} "${value}". Use YYYY-MM-DD (for example 2026-11-20).`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new EvandApiError(`Invalid ${field} "${value}". Use a real calendar date in YYYY-MM-DD format.`);
  }
  return value;
}

export class EvandClient {
  private readonly apiBase: string;
  private readonly webBase: string;
  private readonly timeoutMs: number;
  private readonly debug: boolean;

  private citiesCache: { expiresAt: number; data: City[] } | null = null;
  private citiesPromise: Promise<City[]> | null = null;
  private categoriesCache: { expiresAt: number; data: Category[] } | null = null;
  private categoriesPromise: Promise<Category[]> | null = null;

  constructor(options: {
    apiBase?: string;
    webBase?: string;
    timeoutMs?: number;
    debug?: boolean;
  } = {}) {
    this.apiBase = (options.apiBase ?? process.env.EVAND_API_BASE_URL ?? DEFAULT_API_BASE).replace(/\/+$/, "");
    this.webBase = (options.webBase ?? process.env.EVAND_WEB_BASE_URL ?? DEFAULT_WEB_BASE).replace(/\/+$/, "");
    this.timeoutMs = options.timeoutMs ?? Number(process.env.EVAND_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    this.debug = options.debug ?? process.env.EVAND_MCP_DEBUG === "1";
  }

  private log(message: string, details?: unknown): void {
    if (!this.debug) return;
    if (details === undefined) {
      console.error(`[evand-mcp] ${message}`);
    } else {
      console.error(`[evand-mcp] ${message}`, details);
    }
  }

  private async request<T>(
    path: string,
    params: Record<string, QueryValue> = {},
    attempt = 0,
  ): Promise<T> {
    const url = new URL(path, `${this.apiBase}/`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }

    const timeoutMs = Number.isFinite(this.timeoutMs)
      ? Math.min(60_000, Math.max(1_000, this.timeoutMs))
      : DEFAULT_TIMEOUT_MS;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "evand-mcp/0.1.0 (+https://evand.com)",
        },
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      const isAbort = controller.signal.aborted;
      if (attempt < 2) {
        this.log(`${isAbort ? "Timeout" : "Network error"} on ${url.pathname}; retrying`);
        await sleep(500 * 2 ** attempt);
        return this.request<T>(path, params, attempt + 1);
      }
      const reason = isAbort ? `timed out after ${timeoutMs}ms` : (error as Error).message;
      throw new EvandApiError(`Could not reach the Evand API (${reason}). Try again shortly.`);
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = null;
      }
    }

    if (!response.ok) {
      const record = asRecord(body);
      const apiMessage = asString(record?.message);
      const errors = asRecord(record?.errors);
      const validationMessage = errors
        ? Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .map((value) => String(value))
            .join("; ")
        : null;
      const message = validationMessage || apiMessage || response.statusText || "Unknown error";

      const retryable = response.status === 429 || response.status >= 500;
      if (retryable && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0
          ? Math.min(5_000, retryAfter * 1_000)
          : 500 * 2 ** attempt;
        this.log(`HTTP ${response.status} on ${url.pathname}; retrying in ${delay}ms`);
        await sleep(delay);
        return this.request<T>(path, params, attempt + 1);
      }

      throw new EvandApiError(`Evand API error (HTTP ${response.status}): ${message}`, response.status);
    }

    if (body === null) {
      throw new EvandApiError(`Evand API returned an invalid JSON response for ${url.pathname}.`, response.status);
    }

    return body as T;
  }

  async getCities(forceRefresh = false): Promise<City[]> {
    const now = Date.now();
    if (!forceRefresh && this.citiesCache && this.citiesCache.expiresAt > now) {
      return this.citiesCache.data;
    }
    if (!forceRefresh && this.citiesPromise) return this.citiesPromise;

    const promise = this.request<{ data: City[] }>("/cities", {
      include: "province",
      sort: "eventCount",
    })
      .then((response) => {
        const cities = Array.isArray(response.data) ? response.data : [];
        this.citiesCache = { expiresAt: Date.now() + METADATA_TTL_MS, data: cities };
        return cities;
      })
      .catch((error) => {
        this.citiesPromise = null;
        throw error;
      })
      .finally(() => {
        this.citiesPromise = null;
      });

    this.citiesPromise = promise;
    return promise;
  }

  async getCategories(forceRefresh = false): Promise<Category[]> {
    const now = Date.now();
    if (!forceRefresh && this.categoriesCache && this.categoriesCache.expiresAt > now) {
      return this.categoriesCache.data;
    }
    if (!forceRefresh && this.categoriesPromise) return this.categoriesPromise;

    const promise = this.request<{ data: Category[] }>("/categories", {
      include: "children",
      order: "-1",
      sort: "eventCount",
    })
      .then((response) => {
        const categories = Array.isArray(response.data) ? response.data : [];
        this.categoriesCache = { expiresAt: Date.now() + METADATA_TTL_MS, data: categories };
        return categories;
      })
      .catch((error) => {
        this.categoriesPromise = null;
        throw error;
      })
      .finally(() => {
        this.categoriesPromise = null;
      });

    this.categoriesPromise = promise;
    return promise;
  }

  private async resolveFilters(input: SearchEventsInput): Promise<{
    cities: City[];
    category: FlatCategory | null;
    appliedCity: SearchEventsResult["filters"]["city"];
    appliedCategory: SearchEventsResult["filters"]["category"];
  }> {
    const cities: City[] = [];
    const cityInputs = (input.city ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (cityInputs.length > 0) {
      const allCities = await this.getCities();
      for (const cityInput of cityInputs) {
        const city = resolveCity(allCities, cityInput);
        if (!city) {
          throw new EvandApiError(
            `City "${cityInput}" was not found on Evand. Try one of: ${suggestCities(allCities, cityInput).join(", ")}.`,
          );
        }
        cities.push(city);
      }
    }

    let category: FlatCategory | null = null;
    if (input.category?.trim()) {
      const allCategories = flattenCategories(await this.getCategories());
      category = resolveCategory(allCategories, input.category);
      if (!category) {
        throw new EvandApiError(
          `Category "${input.category}" was not found on Evand. Try one of: ${suggestCategories(allCategories, input.category).join(", ")}.`,
        );
      }
    }

    const appliedCity = cities.length === 1 && cities[0]
      ? { name: cities[0].name, slug: cities[0].slug }
      : null;

    return {
      cities,
      category,
      appliedCity,
      appliedCategory: category
        ? { title: category.title, slug: category.slug, parent: category.parentTitle }
        : null,
    };
  }

  async searchEvents(input: SearchEventsInput): Promise<SearchEventsResult> {
    const page = Math.max(1, Math.trunc(input.page ?? 1));
    const perPage = Math.min(50, Math.max(1, Math.trunc(input.per_page ?? 12)));
    const from = parseEventDate(input.start_date_from, "start_date_from");
    const to = parseEventDate(input.start_date_to, "start_date_to");
    if (from && to && from > to) {
      throw new EvandApiError("start_date_from must be before or equal to start_date_to.");
    }
    if (
      input.min_price !== undefined &&
      input.max_price !== undefined &&
      input.min_price > input.max_price
    ) {
      throw new EvandApiError("min_price must be less than or equal to max_price.");
    }

    const resolved = await this.resolveFilters(input);
    const sort = input.sort ?? "nearest";

    const sortParam: string | undefined =
      sort === "nearest"
        ? undefined
        : sort === "trending"
          ? "trending"
          : sort === "bestsellers"
            ? "bestsellers"
            : sort === "randomness"
              ? "randomness"
              : "start_date";

    const response = await this.request<{
      data: EventListApi[];
      meta?: unknown;
    }>("/v2/events", {
      per_page: perPage,
      page,
      q: input.query?.trim() || undefined,
      cities: resolved.cities.length ? resolved.cities.map((city) => city.slug).join(",") : undefined,
      categories: resolved.category?.slug,
      online: input.online === true ? "yes" : input.online === false ? "no" : undefined,
      archive: input.include_past === true ? "yes" : undefined,
      min_price: input.min_price,
      max_price: input.max_price,
      min_start_date: from ?? undefined,
      max_start_date: to ?? undefined,
      sort: sortParam,
    });

    const events = (Array.isArray(response.data) ? response.data : [])
      .map((event) => this.normalizeEventSummary(event))
      .filter((event): event is EventSummary => event !== null);

    return {
      filters: {
        query: input.query?.trim() || null,
        city: resolved.appliedCity,
        category: resolved.appliedCategory,
        online: input.online ?? null,
        include_past: input.include_past ?? false,
        price:
          input.min_price !== undefined || input.max_price !== undefined
            ? {
                min: input.min_price ?? null,
                max: input.max_price ?? null,
                currency: "Toman",
              }
            : null,
        start_date:
          from || to
            ? { from: from ?? null, to: to ?? null, timezone: "Asia/Tehran" }
            : null,
        sort,
      },
      pagination: parsePagination(response.meta),
      events,
    };
  }

  async getEvent(slug: string, options: EventDescriptionOptions = {}): Promise<EventDetail> {
    const includeDescription = options.includeDescription !== false;
    const maxDescriptionChars = Math.min(
      MAX_DESCRIPTION_CHARS,
      Math.max(0, Math.trunc(options.maxDescriptionChars ?? 8_000)),
    );

    let eventResponse: { data: EventDetailApi };
    try {
      eventResponse = await this.request<{ data: EventDetailApi }>(
        `/events/${encodeURIComponent(slug)}`,
        { include: EVENT_INCLUDES.join(",") },
      );
    } catch (error) {
      if (error instanceof EvandApiError && error.status === 404) {
        throw new EvandApiError(
          `Event "${slug}" was not found on Evand. Use search_events to find the correct slug, or pass a full https://evand.com/events/<slug> URL.`,
          404,
        );
      }
      throw error;
    }

    if (!eventResponse?.data) {
      throw new EvandApiError(`Event "${slug}" was not found on Evand.`, 404);
    }

    if (!includeDescription || maxDescriptionChars <= 0) {
      return normalizeEventDetail(eventResponse.data, this.webBase, null);
    }

    const descriptionResponse = await this.request<{ data: DescriptionApiItem[] }>(
      `/events/${encodeURIComponent(slug)}/description`,
    ).catch((error: unknown) => {
      this.log(`Could not load description for ${slug}`, (error as Error).message);
      return { data: [] as DescriptionApiItem[] };
    });

    const description = normalizeDescription(descriptionResponse.data, maxDescriptionChars);
    return normalizeEventDetail(eventResponse.data, this.webBase, description);
  }

  async getSimilarEvents(slug: string, limit = 6): Promise<EventSummary[]> {
    const perPage = Math.min(12, Math.max(1, Math.trunc(limit)));
    let response: { data: SimilarEventApi[] };
    try {
      response = await this.request<{ data: SimilarEventApi[] }>(
        `/recommendation/events/${encodeURIComponent(slug)}/similar`,
        { per_page: perPage },
      );
    } catch (error) {
      if (error instanceof EvandApiError && error.status === 404) {
        throw new EvandApiError(
          `Event "${slug}" was not found on Evand, so similar events cannot be loaded. Use search_events to find the correct slug.`,
          404,
        );
      }
      throw error;
    }

    return (Array.isArray(response.data) ? response.data : [])
      .slice(0, perPage)
      .map((event) => this.normalizeSimilarEvent(event))
      .filter((event): event is EventSummary => event !== null);
  }

  async listCities(query?: string, limit = 30, includeEmpty = false): Promise<{
    total: number;
    cities: Array<{
      id: number;
      name: string;
      slug: string;
      events_count: number;
      province: string | null;
      url: string;
    }>;
  }> {
    const allCities = await this.getCities();
    const needle = query?.trim().toLowerCase() ?? "";
    const filtered = allCities.filter((city) => {
      if (!includeEmpty && (city.events_count ?? 0) <= 0) return false;
      if (!needle) return true;
      const haystack = [city.name, city.slug, city.province?.data?.name ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });

    let results = filtered;
    if (needle && results.length === 0) {
      const resolved = resolveCity(allCities, query!.trim());
      if (resolved) results = [resolved];
    }

    const max = Math.min(100, Math.max(1, Math.trunc(limit)));
    return {
      total: results.length,
      cities: results.slice(0, max).map((city) => ({
        id: city.id,
        name: city.name,
        slug: city.slug,
        events_count: city.events_count ?? 0,
        province: city.province?.data?.name ?? null,
        url: joinUrl(this.webBase, `city/${encodeURIComponent(city.slug)}`),
      })),
    };
  }

  async listCategories(query?: string, limit = 100): Promise<{
    total: number;
    categories: Array<{
      id: number;
      title: string;
      slug: string;
      parent: string | null;
      events_count: number;
      url: string;
    }>;
  }> {
    const flat = flattenCategories(await this.getCategories());
    const needle = query?.trim().toLowerCase() ?? "";
    let filtered = needle
      ? flat.filter((category) =>
          [category.title, category.slug, category.parentTitle ?? ""]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
      : flat;

    if (needle && filtered.length === 0) {
      const resolved = resolveCategory(flat, query!.trim());
      if (resolved) filtered = [resolved];
    }

    const max = Math.min(300, Math.max(1, Math.trunc(limit)));
    return {
      total: filtered.length,
      categories: filtered.slice(0, max).map((category) => ({
        id: category.id,
        title: category.title,
        slug: category.slug,
        parent: category.parentTitle,
        events_count: category.events_count,
        url: joinUrl(this.webBase, `categories/${encodeURIComponent(category.slug)}`),
      })),
    };
  }

  async searchOrganizations(input: {
    query?: string;
    sort?: "followers" | "bestsellers" | "partnerships";
    page?: number;
    per_page?: number;
  } = {}): Promise<{
    pagination: Pagination;
    organizations: OrganizationSummary[];
  }> {
    const page = Math.max(1, Math.trunc(input.page ?? 1));
    const perPage = Math.min(50, Math.max(1, Math.trunc(input.per_page ?? 12)));
    const sort =
      input.sort === "bestsellers"
        ? "bestsellers"
        : input.sort === "partnerships"
          ? "partnerships"
          : "followersCount";

    const response = await this.request<{
      data: OrganizationRef[];
      meta?: unknown;
    }>("/organizations", {
      q: input.query?.trim() || undefined,
      sort,
      page,
      per_page: perPage,
    });

    return {
      pagination: parsePagination(response.meta),
      organizations: (Array.isArray(response.data) ? response.data : [])
        .map((organization) => this.normalizeOrganizationSummary(organization))
        .filter((organization): organization is OrganizationSummary => organization !== null),
    };
  }

  async getOrganization(
    slug: string,
    options: { includeEvents?: boolean; eventsLimit?: number; includePastEvents?: boolean; maxDescriptionChars?: number } = {},
  ): Promise<OrganizationDetail> {
    let response: { data: OrganizationRef };
    try {
      response = await this.request<{ data: OrganizationRef }>(
        `/organizations/${encodeURIComponent(slug)}`,
      );
    } catch (error) {
      if (error instanceof EvandApiError && error.status === 404) {
        throw new EvandApiError(
          `Organization "${slug}" was not found on Evand. Use search_organizations to find the correct slug, or pass a full https://evand.com/organizations/<slug> URL.`,
          404,
        );
      }
      throw error;
    }
    if (!response?.data) {
      throw new EvandApiError(`Organization "${slug}" was not found on Evand.`, 404);
    }

    const includeEvents = options.includeEvents !== false;
    const eventsLimit = Math.min(30, Math.max(1, Math.trunc(options.eventsLimit ?? 12)));
    const maxDescriptionChars = Math.min(
      20_000,
      Math.max(0, Math.trunc(options.maxDescriptionChars ?? 4_000)),
    );

    let events: EventSummary[] = [];
    if (includeEvents) {
      const orgId = asString(response.data.id);
      if (orgId) {
        const eventResponse = await this.request<{ data: EventListApi[] }>("/v2/events", {
          organization_id: orgId,
          per_page: eventsLimit,
          archive: options.includePastEvents ? "yes" : undefined,
          sort: options.includePastEvents ? "start_date" : undefined,
        }).catch((error: unknown) => {
          this.log(`Could not load events for organization ${slug}`, (error as Error).message);
          return { data: [] as EventListApi[] };
        });

        events = (Array.isArray(eventResponse.data) ? eventResponse.data : [])
          .map((event) => this.normalizeEventSummary(event))
          .filter((event): event is EventSummary => event !== null);
      }
    }

    const summary = this.normalizeOrganizationSummary(response.data, maxDescriptionChars);
    if (!summary) {
      throw new EvandApiError(`Organization "${slug}" could not be parsed.`, 404);
    }

    return {
      ...summary,
      events,
    };
  }

  private normalizeEventSummary(event: EventListApi): EventSummary | null {
    if (!event || typeof event.id !== "number" || !event.slug) return null;

    const organization = normalizeOrganizationRef(event.organization, this.webBase);
    const price = normalizePrice(
      event.minimum_ticket_price ?? event.prices?.data?.min,
      event.maximum_ticket_price ?? event.prices?.data?.max,
    );

    return {
      id: event.id,
      name: event.name ?? "",
      slug: event.slug,
      url: eventUrl(this.webBase, event.slug),
      start_date: normalizeIsoDate(event.start_date),
      end_date: normalizeIsoDate(event.end_date),
      start_date_tehran: formatTehranDate(event.start_date),
      end_date_tehran: formatTehranDate(event.end_date),
      online: truthy(event.online),
      city: asString(event.city_name),
      address: asString(event.address),
      organization,
      price,
      status: {
        ended: event.ended === true,
        sold_out: event.soldout === true,
        cancelled: event.cancelled === true,
        partnership: asString(event.partnership?.status),
      },
      cover: coverUrl(event.cover),
    };
  }

  private normalizeSimilarEvent(event: SimilarEventApi): EventSummary | null {
    if (!event || !event.slug) return null;
    const price = normalizePrice(event.minimum_ticket_price, event.maximum_ticket_price);
    return {
      id: event.id ?? null,
      name: event.name ?? "",
      slug: event.slug,
      url: eventUrl(this.webBase, event.slug),
      start_date: normalizeIsoDate(event.start_date),
      end_date: normalizeIsoDate(event.end_date),
      start_date_tehran: formatTehranDate(event.start_date),
      end_date_tehran: formatTehranDate(event.end_date),
      online: truthy(event.online),
      city: asString(event.city_name),
      address: null,
      organization: event.organization_slug || event.organization_name
        ? {
            name: asString(event.organization_name),
            slug: asString(event.organization_slug),
            url: event.organization_slug ? organizationUrl(this.webBase, event.organization_slug) : null,
            logo: asString(event.organization_logo),
          }
        : null,
      price,
      status: {
        ended: false,
        sold_out: false,
        cancelled: false,
        partnership: null,
      },
      cover: coverUrl(event.cover),
    };
  }

  private normalizeOrganizationSummary(
    organization: OrganizationRef,
    descriptionLimit = 400,
  ): OrganizationSummary | null {
    const slug = asString(organization.slug);
    const name = asString(organization.name);
    if (!slug && !name) return null;

    const descriptionHtml =
      asString(organization.description) ?? asString(organization.striped_description) ?? "";
    const description = htmlToText(descriptionHtml);
    const recommended = organization as OrganizationRef & {
      recommended?: { value?: { percent_of_recommended?: number | null } | null } | null;
    };
    const recommendedPercent = asNumber(recommended.recommended?.value?.percent_of_recommended);
    const effectiveSlug = slug ?? name!;

    return {
      id: asString(organization.id),
      name: name ?? effectiveSlug,
      slug: effectiveSlug,
      url: organizationUrl(this.webBase, effectiveSlug),
      logo: coverUrl(organization.logo),
      cover: coverUrl(organization.cover),
      description: truncateText(description, descriptionLimit).text,
      followers_count: asNumber(organization.followers_count),
      events_count: asNumber(organization.events_count),
      active_events_count: asNumber(organization.active_events_count),
      partnership: asString(organization.partnership?.status),
      recommended_percent: recommendedPercent,
      socials: normalizeSocials(organization.socials as Record<string, unknown> | null | undefined),
    };
  }
}

function normalizeDescriptionSections(raw: DescriptionApiItem[]): {
  sections: DescriptionSection[];
  truncated: boolean;
} {
  const sections: DescriptionSection[] = [];
  let truncated = false;

  for (const section of Array.isArray(raw) ? raw : []) {
    const type = asString(section.type) ?? "description";
    const title = asString(section.title);
    const body =
      htmlToText(section.description) ||
      (typeof section.content === "string" ? htmlToText(section.content) : "");
    const content = section.content;

    let items: Array<Record<string, string | null>> | null = null;
    if (Array.isArray(content)) {
      items = content
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return { name: String(item) };
          }
          const itemRecord = asRecord(item);
          if (!itemRecord) return null;
          const normalized: Record<string, string | null> = {};
          const preferredKeys = [
            "name",
            "title",
            "position",
            "role",
            "description",
            "image",
            "logo",
            "website",
            "linkedin",
            "instagram",
            "telegram",
            "twitter",
            "facebook",
            "github",
          ];
          for (const key of preferredKeys) {
            const value = asString(itemRecord[key]);
            if (!value) continue;
            normalized[key] =
              key === "description" ? truncateText(htmlToText(value), 400).text : value;
          }
          return Object.keys(normalized).length > 0 ? normalized : null;
        })
        .filter((item): item is Record<string, string | null> => item !== null);
      if (items.length === 0) items = null;
    }

    if (!title && !body && !items) continue;
    sections.push({ type, title, text: body || null, items });
  }

  return { sections, truncated };
}

function normalizeDescription(raw: DescriptionApiItem[], maxChars: number): EventDescription {
  try {
    const { sections } = normalizeDescriptionSections(raw);
    const fullText = sections
      .map((section) => {
        const parts: string[] = [];
        if (section.title) parts.push(section.title);
        if (section.text) parts.push(section.text);
        if (section.items) {
          for (const item of section.items) {
            const label = item.name ?? item.title ?? null;
            const position = item.position ?? item.role ?? null;
            if (label) parts.push(position ? `${label} — ${position}` : label);
          }
        }
        return parts.join("\n");
      })
      .filter(Boolean)
      .join("\n\n");

    const budgeted = truncateText(fullText, maxChars);
    let remaining = maxChars;
    const trimmedSections: DescriptionSection[] = [];

    for (const section of sections) {
      if (remaining <= 0) break;

      const heading = section.title ?? "";
      const body = section.text ?? "";
      const combined = [heading, body].filter(Boolean).join("\n");

      if (combined.length <= remaining) {
        trimmedSections.push(section);
        remaining -= combined.length;
        continue;
      }

      if (remaining > 20) {
        trimmedSections.push({
          ...section,
          title: heading.length <= remaining ? heading : null,
          text: truncateText(body || heading, Math.max(20, remaining - Math.min(heading.length, 100))).text,
          items: null,
        });
      }
      remaining = 0;
      break;
    }

    return {
      text: budgeted.text,
      sections: trimmedSections,
      truncated: budgeted.truncated,
      error: null,
    };
  } catch (error) {
    return {
      text: "",
      sections: [],
      truncated: false,
      error: (error as Error).message,
    };
  }
}

function normalizeEventDetail(
  event: EventDetailApi,
  webBase: string,
  description: EventDescription | null,
): EventDetail {
  if (!event || typeof event.id !== "number" || !event.slug) {
    throw new EvandApiError("Evand returned an event without an id or slug.");
  }

  const organizationRaw = pickRecord(event.organization);
  const cityRaw = pickRecord(event.city);
  const categoryRaw = pickRecord(event.category);
  const parentCategoryRaw = categoryRaw ? pickRecord(categoryRaw.parent) : null;
  const typeRaw = pickRecord(event.type);
  const pricesRaw = pickRecord(event.prices);
  const tagsRaw = Array.isArray(event.tags?.data) ? event.tags.data : [];
  const ticketsRaw = Array.isArray(event.tickets?.data) ? event.tickets.data : [];
  const showtimesRaw = Array.isArray(event.showtimes?.data) ? event.showtimes.data : [];
  const circlesRaw = Array.isArray(event.circles) ? event.circles : [];

  const minPrice = asNumber(pricesRaw?.min) ?? asNumber(event.minimum_ticket_price);
  const maxPrice = asNumber(pricesRaw?.max) ?? asNumber(event.maximum_ticket_price);
  const price = normalizePrice(minPrice, maxPrice, event.is_free === true);

  const tickets: EventTicket[] = ticketsRaw
    .filter((ticket) => {
      if (!ticket) return false;
      if (ticket.active === undefined || ticket.active === null) return true;
      return truthy(ticket.active);
    })
    .map((ticket) => ({
      id: ticket.id,
      title: asString(ticket.title) ?? "Ticket",
      type: asString(ticket.type) ?? "normal",
      price: asNumber(ticket.price) ?? 0,
      price_display: normalizePrice(asNumber(ticket.price) ?? 0, asNumber(ticket.price) ?? 0).display,
      available_count: asNumber(ticket.available_count),
      capacity: asNumber(ticket.capacity),
      min_count: asNumber(ticket.min_count),
      max_count: asNumber(ticket.max_count),
      active: truthy(ticket.active),
      showtime_id: asNumber(ticket.showtime_id),
      sale_start: normalizeIsoDate(ticket.start_date),
      sale_end: normalizeIsoDate(ticket.end_date),
      description: htmlToText(ticket.description),
      login_required: truthy(ticket.login_required),
    }));

  const availableTickets = tickets
    .map((ticket) => ticket.available_count)
    .filter((value): value is number => value !== null);
  const ticketPrices = tickets.map((ticket) => ticket.price).filter((value) => Number.isFinite(value));

  const showtimes: EventShowtime[] = showtimesRaw.map((showtime) => ({
    id: showtime.id,
    label: asString(showtime.label) ?? "Showtime",
    start_date: normalizeIsoDate(showtime.start_date),
    end_date: normalizeIsoDate(showtime.end_date),
    start_date_tehran: formatTehranDate(showtime.start_date),
    end_date_tehran: formatTehranDate(showtime.end_date),
    description: htmlToText(showtime.description),
    has_purchasable_ticket: showtime.has_purchasable_ticket === true,
  }));

  const categoryTitle = categoryRaw ? asString(categoryRaw.title) : null;
  const parentCategoryTitle = parentCategoryRaw ? asString(parentCategoryRaw.title) : null;
  const categoryPath = [parentCategoryTitle, categoryTitle].filter(
    (value): value is string => Boolean(value),
  );

  const organization: EventDetail["organization"] = organizationRaw
    ? {
        name: asString(organizationRaw.name),
        slug: asString(organizationRaw.slug),
        url: asString(organizationRaw.slug)
          ? organizationUrl(webBase, asString(organizationRaw.slug)!)
          : null,
        logo: coverUrl(organizationRaw.logo as Cover | string | null | undefined),
        description: truncateText(htmlToText(asString(organizationRaw.description)), 600).text || null,
        followers_count: asNumber(organizationRaw.followers_count),
        events_count: asNumber(organizationRaw.events_count),
        socials: normalizeSocials(organizationRaw.socials as Record<string, unknown> | null | undefined),
      }
    : null;

  const latitude = asNumber(event.latitude);
  const longitude = asNumber(event.longitude);
  const mapUrl =
    latitude !== null && longitude !== null && (latitude !== 0 || longitude !== 0)
      ? `https://www.google.com/maps?q=${latitude},${longitude}`
      : null;

  return {
    id: event.id,
    name: event.name ?? "",
    slug: event.slug,
    url: eventUrl(webBase, event.slug),
    start_date: normalizeIsoDate(event.start_date),
    end_date: normalizeIsoDate(event.end_date),
    start_date_tehran: formatTehranDate(event.start_date),
    end_date_tehran: formatTehranDate(event.end_date),
    online: truthy(event.online),
    city: asString(cityRaw?.name) ?? asString(event.city_name),
    address: asString(event.address),
    organization,
    price,
    status: {
      ended: event.ended === true,
      sold_out: event.soldout === true,
      cancelled: event.cancelled === true,
      partnership: asString(event.partnership?.status),
    },
    cover: coverUrl(event.cover),
    website: asString(event.website),
    socials: normalizeSocials(event.socials as Record<string, unknown> | null | undefined),
    category:
      categoryRaw && categoryTitle
        ? {
            id: asNumber(categoryRaw.id) ?? 0,
            title: categoryTitle,
            slug: asString(categoryRaw.slug) ?? "",
            path: categoryPath,
          }
        : null,
    type: typeRaw ? asString(typeRaw.title) : null,
    tags: tagsRaw
      .map((tag) => asString(tag?.name))
      .filter((tag): tag is string => Boolean(tag)),
    location: {
      online: truthy(event.online),
      city: asString(cityRaw?.name) ?? asString(event.city_name),
      city_slug: asString(cityRaw?.slug),
      address: asString(event.address),
      latitude,
      longitude,
      map_url: mapUrl,
    },
    showtimes,
    tickets,
    ticket_summary: {
      active_tickets: tickets.length,
      available_tickets:
        availableTickets.length > 0
          ? availableTickets.reduce((sum, count) => sum + count, 0)
          : null,
      min_price: ticketPrices.length ? Math.min(...ticketPrices) : price.min,
      max_price: ticketPrices.length ? Math.max(...ticketPrices) : price.max,
      sold_out: event.soldout === true || (tickets.length > 0 && tickets.every((ticket) => ticket.available_count === 0)),
    },
    circles: circlesRaw
      .filter((circle) => asString(circle?.name) || asString(circle?.slug))
      .map((circle) => ({
        name: asString(circle.name) ?? asString(circle.slug) ?? "",
        slug: asString(circle.slug) ?? asString(circle.name) ?? "",
        logo: coverUrl(circle.logo),
      })),
    timing_status: asString(event.timing_status),
    published: asString(event.published),
    refund_policy: truncateText(htmlToText(event.refund_policy), 2_000).text || null,
    description,
    registration_url: eventUrl(webBase, event.slug),
  };
}

/** Turns a slug, a relative /events/... path, or a full Evand URL into a slug. */
export function parseEventSlug(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new EvandApiError("An event slug or URL is required.");

  if (/^https?:\/\//i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      throw new EvandApiError(`"${input}" is not a valid URL.`);
    }
    const hostname = url.hostname.toLowerCase();
    if (hostname !== "evand.com" && !hostname.endsWith(".evand.com")) {
      throw new EvandApiError(`Expected a URL on evand.com, got ${url.hostname}.`);
    }
    const match = url.pathname.match(/^\/events\/([^/]+)\/?$/);
    if (!match?.[1]) {
      throw new EvandApiError(`The URL does not point to an Evand event page: ${input}`);
    }
    return safeDecodeURIComponent(match[1]);
  }

  return safeDecodeURIComponent(
    trimmed
      .replace(/^\/+/, "")
      .replace(/^events\//i, "")
      .replace(/\/+$/, ""),
  );
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
