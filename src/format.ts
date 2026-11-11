/**
 * Small, dependency-free formatting helpers shared by the Evand tools.
 * All display dates are rendered in Asia/Tehran (the timezone used by Evand).
 */

const TEHRAN_TIME_ZONE = "Asia/Tehran";

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  copy: "©",
  gt: ">",
  hellip: "…",
  laquo: "«",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: "\u00a0",
  ndash: "–",
  quot: '"',
  raquo: "»",
  rdquo: "”",
  reg: "®",
  rsquo: "’",
  trade: "™",
  zwnj: "\u200c",
  zwj: "\u200d",
};

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10);
      if (Number.isInteger(codePoint) && codePoint > 0 && codePoint <= 0x10ffff) {
        try {
          return String.fromCodePoint(codePoint);
        } catch {
          return match;
        }
      }
      return match;
    }
    return NAMED_ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/**
 * Converts an HTML fragment from the Evand description API into readable text.
 * Handles paragraphs, line breaks, lists, scripts/styles and common entities.
 */
export function htmlToText(html: string | null | undefined): string {
  if (!html) return "";

  let text = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|noscript|iframe|svg)\b[^>]*>[\s\S]*?<\/\1>/gi, "");

  text = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(p|div|h[1-6]|blockquote|tr|section|article|ul|ol|table|figcaption)>/gi, "\n")
    .replace(/<[^>]+>/g, "");

  text = decodeEntities(text)
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{2,}/g, "\n")
    .trim();

  return text;
}

/** Keeps the start of a string and appends a short marker when it was cut. */
export function truncateText(value: string, maxChars: number): { text: string; truncated: boolean } {
  if (maxChars <= 0) return { text: "", truncated: value.length > 0 };
  if (value.length <= maxChars) return { text: value, truncated: false };

  const slice = value.slice(0, Math.max(0, maxChars - 1));
  const lastSpace = slice.lastIndexOf(" ");
  const boundary = lastSpace > 0 ? lastSpace : slice.length;
  return { text: `${slice.slice(0, boundary).trimEnd()}…`, truncated: true };
}

function tehranParts(date: Date): Record<string, string> {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TEHRAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });

  const result: Record<string, string> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") result[part.type] = part.value;
  }
  return result;
}

/** Normalizes an API timestamp (e.g. `+0330`) to ISO 8601 (e.g. `+03:30`). */
export function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return value.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
}

/** Renders an API timestamp as `YYYY-MM-DD HH:mm` in Tehran local time. */
export function formatTehranDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = tehranParts(date);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function formatTehranDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = tehranParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(amount);
}

export interface NormalizedPrice {
  min: number | null;
  max: number | null;
  is_free: boolean;
  currency: "Toman";
  display: string;
}

export function normalizePrice(
  min: number | null | undefined,
  max: number | null | undefined,
  isFreeFlag?: boolean | null,
): NormalizedPrice {
  const hasMin = typeof min === "number" && Number.isFinite(min);
  const hasMax = typeof max === "number" && Number.isFinite(max);
  const normalizedMin = hasMin ? Math.max(0, min) : null;
  const normalizedMax = hasMax ? Math.max(0, max) : null;
  const isFree = isFreeFlag ?? (normalizedMin === 0 && normalizedMax === 0);

  let display: string;
  if (isFree) {
    display = "Free";
  } else if (normalizedMin === null && normalizedMax === null) {
    display = "Price not listed";
  } else if (normalizedMin === null) {
    display = `${formatMoney(normalizedMax!)} Toman`;
  } else if (normalizedMax === null || normalizedMin === normalizedMax) {
    display = `${formatMoney(normalizedMin)} Toman`;
  } else if (normalizedMin === 0) {
    display = `Free – ${formatMoney(normalizedMax)} Toman`;
  } else {
    display = `${formatMoney(normalizedMin)} – ${formatMoney(normalizedMax)} Toman`;
  }

  return {
    min: normalizedMin,
    max: normalizedMax === null ? normalizedMin : normalizedMax,
    is_free: isFree,
    currency: "Toman",
    display,
  };
}
