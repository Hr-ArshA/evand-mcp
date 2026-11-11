import { describe, expect, it } from "vitest";
import {
  flattenCategories,
  resolveCategory,
  resolveCity,
  suggestCities,
  type Category,
  type City,
} from "../src/resolver.js";

const cities: City[] = [
  { id: 87, name: "تهران", slug: "تهران", events_count: 95 },
  { id: 130, name: "مشهد", slug: "مشهد", events_count: 17 },
  { id: 45, name: "اصفهان", slug: "اصفهان", events_count: 11 },
  { id: 194, name: "شیراز", slug: "شیراز", events_count: 3 },
];

const categories: Category[] = [
  {
    id: 1,
    parent_id: 0,
    title: "تکنولوژی",
    slug: "تکنولوژی",
    events_count: 5,
    children: {
      data: [
        { id: 311, parent_id: 1, title: "هوش مصنوعی", slug: "هوش مصنوعی", events_count: 3 },
        { id: 177, parent_id: 1, title: "فین‌تک", slug: "فین-تک", events_count: 2 },
        { id: 3, parent_id: 1, title: "برنامه نویسی", slug: "برنامه-نویسی", events_count: 0 },
      ],
    },
  },
  {
    id: 2,
    parent_id: 0,
    title: "مالی",
    slug: "مالی",
    events_count: 1,
    children: { data: [{ id: 10, parent_id: 2, title: "بورس", slug: "بورس", events_count: 0 }] },
  },
];

const flat = flattenCategories(categories);

describe("resolveCity", () => {
  it("resolves Persian names, slugs and English aliases", () => {
    expect(resolveCity(cities, "تهران")?.id).toBe(87);
    expect(resolveCity(cities, "tehran")?.id).toBe(87);
    expect(resolveCity(cities, "Tehran")?.id).toBe(87);
    expect(resolveCity(cities, "مشهد")?.id).toBe(130);
    expect(resolveCity(cities, "mashhad")?.id).toBe(130);
    expect(resolveCity(cities, "isfahan")?.id).toBe(45);
    expect(resolveCity(cities, "شیراز")?.id).toBe(194);
  });

  it("tolerates decoration, ZWNJ and Arabic letter variants", () => {
    expect(resolveCity(cities, "شهر تهران")?.id).toBe(87);
    expect(resolveCity(cities, "  تهران  ")?.id).toBe(87);
    expect(resolveCity(cities, "تهران‌")?.id).toBe(87);
  });

  it("returns null for unknown cities", () => {
    expect(resolveCity(cities, "atlantis")).toBeNull();
    expect(resolveCity(cities, "")).toBeNull();
  });
});

describe("resolveCategory", () => {
  it("resolves top-level categories and English aliases", () => {
    expect(resolveCategory(flat, "تکنولوژی")?.slug).toBe("تکنولوژی");
    expect(resolveCategory(flat, "technology")?.slug).toBe("تکنولوژی");
    expect(resolveCategory(flat, "مالی")?.slug).toBe("مالی");
    expect(resolveCategory(flat, "finance")?.slug).toBe("مالی");
  });

  it("resolves subcategories and compact spellings", () => {
    expect(resolveCategory(flat, "هوش مصنوعی")?.slug).toBe("هوش مصنوعی");
    expect(resolveCategory(flat, "ai")?.slug).toBe("هوش مصنوعی");
    expect(resolveCategory(flat, "artificial intelligence")?.slug).toBe("هوش مصنوعی");
    expect(resolveCategory(flat, "فین تک")?.slug).toBe("فین-تک");
    expect(resolveCategory(flat, "fintech")?.slug).toBe("فین-تک");
    expect(resolveCategory(flat, "بورس")?.slug).toBe("بورس");
  });

  it("returns null for unknown categories", () => {
    expect(resolveCategory(flat, "underwater basket weaving")).toBeNull();
  });
});

describe("suggestions", () => {
  it("suggests popular cities with English aliases", () => {
    const suggestions = suggestCities(cities, "atlantis");
    expect(suggestions[0]).toContain("تهران");
    expect(suggestions[0]).toContain("tehran");
    expect(suggestions).toHaveLength(4);
  });
});
