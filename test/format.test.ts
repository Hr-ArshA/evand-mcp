import { describe, expect, it } from "vitest";
import {
  formatMoney,
  formatTehranDate,
  htmlToText,
  normalizeIsoDate,
  normalizePrice,
  truncateText,
} from "../src/format.js";

describe("htmlToText", () => {
  it("strips markup and preserves paragraphs, lists and line breaks", () => {
    const html =
      "<div><p>Hello <strong>world</strong></p><ul><li>One</li><li>Two</li></ul><br>Done</div>";
    expect(htmlToText(html)).toBe("Hello world\n- One\n- Two\nDone");
  });

  it("removes scripts and styles", () => {
    expect(htmlToText('<p>A</p><script>alert("x")</script><style>p{}</style><p>B</p>')).toBe(
      "A\nB",
    );
  });

  it("decodes named and numeric entities", () => {
    expect(htmlToText("A&nbsp;B &amp; C &zwnj; D &#174; &#x200c;")).toBe("A B & C \u200c D ® \u200c");
  });

  it("is null-safe", () => {
    expect(htmlToText(null)).toBe("");
    expect(htmlToText(undefined)).toBe("");
    expect(htmlToText("")).toBe("");
  });
});

describe("truncateText", () => {
  it("leaves short text alone", () => {
    expect(truncateText("short", 10)).toEqual({ text: "short", truncated: false });
  });

  it("truncates at a word boundary with an ellipsis", () => {
    const result = truncateText("one two three four", 12);
    expect(result.truncated).toBe(true);
    expect(result.text).toBe("one two…");
    expect(result.text.length).toBeLessThanOrEqual(12);
  });

  it("returns an empty string for a zero budget", () => {
    expect(truncateText("anything", 0)).toEqual({ text: "", truncated: true });
  });
});

describe("dates", () => {
  it("normalizes Evand's compact offsets to ISO 8601", () => {
    expect(normalizeIsoDate("2026-11-10T19:00:00+0330")).toBe("2026-11-10T19:00:00+03:30");
    expect(normalizeIsoDate("2026-11-10T19:00:00+03:30")).toBe("2026-11-10T19:00:00+03:30");
    expect(normalizeIsoDate(null)).toBeNull();
    expect(normalizeIsoDate("not-a-date")).toBeNull();
  });

  it("renders Tehran local time", () => {
    expect(formatTehranDate("2026-11-10T19:00:00+0330")).toBe("2026-11-10 19:00");
    expect(formatTehranDate("2026-11-10T16:30:00+0000")).toBe("2026-11-10 20:00");
    expect(formatTehranDate(null)).toBeNull();
  });
});

describe("prices", () => {
  it("formats a fixed range in Toman", () => {
    expect(formatMoney(2990000)).toBe("2,990,000");
    const price = normalizePrice(2990000, 2990000);
    expect(price.display).toBe("2,990,000 Toman");
    expect(price.is_free).toBe(false);
    expect(price.currency).toBe("Toman");
  });

  it("formats ranges and free events", () => {
    expect(normalizePrice(100000, 200000).display).toBe("100,000 – 200,000 Toman");
    expect(normalizePrice(0, 0).display).toBe("Free");
    expect(normalizePrice(0, 0, true).is_free).toBe(true);
    expect(normalizePrice(0, 500000).display).toBe("Free – 500,000 Toman");
  });

  it("handles missing prices", () => {
    expect(normalizePrice(null, null).display).toBe("Price not listed");
    expect(normalizePrice(undefined, undefined).display).toBe("Price not listed");
  });
});
