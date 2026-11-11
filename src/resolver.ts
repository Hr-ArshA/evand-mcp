/**
 * Pure matching helpers for converting human-friendly city/category names
 * (Persian, English, or Evand slugs) into the slugs expected by the Evand API.
 */

export interface City {
  id: number;
  name: string;
  slug: string;
  latitude?: number;
  longitude?: number;
  events_count?: number;
  province?: { data?: { id: number; name: string; slug: string } | null } | null;
}

export interface Category {
  id: number;
  parent_id: number;
  title: string;
  slug: string;
  events_count?: number;
  children?: { data?: Category[] } | null;
  parent?: { data?: Category } | null;
}

export interface FlatCategory {
  id: number;
  title: string;
  slug: string;
  events_count: number;
  parentTitle: string | null;
  parentSlug: string | null;
}

/**
 * Normalizes Persian/English input for fuzzy lookups. It intentionally does not
 * alter the value sent to Evand; it is only used for local matching.
 */
export function normalizeLookup(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff\u0640]/g, "")
    .replace(/[\u064b-\u065f\u0670]/g, "")
    .replace(/\u064a/g, "ی")
    .replace(/\u0643/g, "ک")
    .replace(/\u0649/g, "ی")
    .replace(/\u0629/g, "ه")
    .replace(/[\u0623\u0625\u0622]/g, "ا")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function compact(value: string): string {
  return normalizeLookup(value).replace(/\s+/g, "");
}

export function flattenCategories(categories: Category[]): FlatCategory[] {
  const flat: FlatCategory[] = [];

  for (const category of categories) {
    flat.push({
      id: category.id,
      title: category.title,
      slug: category.slug,
      events_count: category.events_count ?? 0,
      parentTitle: null,
      parentSlug: null,
    });

    for (const child of category.children?.data ?? []) {
      flat.push({
        id: child.id,
        title: child.title,
        slug: child.slug,
        events_count: child.events_count ?? 0,
        parentTitle: category.title,
        parentSlug: category.slug,
      });
    }
  }

  return flat;
}

/**
 * Common English (and transliterated) names for Iranian cities. Evand's own
 * API only accepts Persian slugs, so these are resolved locally.
 */
const CITY_ALIASES: Record<string, string> = {
  tehran: "تهران",
  teheran: "تهران",
  mashhad: "مشهد",
  mashad: "مشهد",
  isfahan: "اصفهان",
  esfahan: "اصفهان",
  shiraz: "شیراز",
  tabriz: "تبریز",
  karaj: "کرج",
  qom: "قم",
  ghom: "قم",
  ahvaz: "اهواز",
  ahwaz: "اهواز",
  kish: "کیش",
  qeshm: "قشم",
  rasht: "رشت",
  yazd: "یزد",
  kerman: "کرمان",
  kermanshah: "کرمانشاه",
  hamedan: "همدان",
  hamadan: "همدان",
  urmia: "ارومیه",
  orumiyeh: "ارومیه",
  "bandar abbas": "بندر عباس",
  bandarabbas: "بندر عباس",
  "bandar anzali": "بندر انزلی",
  anzali: "بندر انزلی",
  zahedan: "زاهدان",
  qazvin: "قزوین",
  ghazvin: "قزوین",
  sari: "ساری",
  sanandaj: "سنندج",
  bushehr: "بوشهر",
  bandar: "بندر",
  ardabil: "اردبیل",
  ardebil: "اردبیل",
  ilam: "ایلام",
  birjand: "بیرجند",
  bojnord: "بجنورد",
  bojnourd: "بجنورد",
  "shahr e kord": "شهرکرد",
  shahrekord: "شهرکرد",
  semnan: "سمنان",
  chabahar: "چابهار",
  varamin: "ورامین",
  islamshahr: "اسلامشهر",
  shahriar: "شهریار",
  lavasan: "لواسان",
  "kish island": "کیش",
  "qeshm island": "قشم",
  tehranprovince: "تهران",
};

/**
 * Aliases for the top-level category pages and the child categories people
 * most often ask for in English. The canonical values are Evand titles.
 */
const CATEGORY_ALIASES: Record<string, string> = {
  technology: "تکنولوژی",
  tech: "تکنولوژی",
  it: "تکنولوژی",
  business: "کسب و کار",
  finance: "مالی",
  financial: "مالی",
  money: "مالی",
  management: "مدیریت",
  "personal development": "توسعه فردی و خانواده",
  "personal growth": "توسعه فردی و خانواده",
  family: "توسعه فردی و خانواده",
  entrepreneurship: "کارآفرینی",
  startup: "کارآفرینی",
  engineering: "فنی، مهندسی و صنعت",
  industry: "فنی، مهندسی و صنعت",
  technical: "فنی، مهندسی و صنعت",
  education: "تحصیلی",
  academic: "تحصیلی",
  study: "تحصیلی",
  other: "غیره",
  misc: "غیره",
  humanities: "علوم انسانی",
  medicine: "پزشکی",
  medical: "پزشکی",
  health: "پزشکی",
  art: "فرهنگی هنری",
  arts: "فرهنگی هنری",
  culture: "فرهنگی هنری",
  entertainment: "سرگرمی",
  fun: "سرگرمی",
  science: "علوم پایه",
  sciences: "علوم پایه",
  tourism: "گردشگری",
  travel: "گردشگری",
  religious: "مذهبی و مناسبتی",
  religion: "مذهبی و مناسبتی",
  sports: "ورزشی",
  sport: "ورزشی",
  charity: "خیریه",
  ai: "هوش مصنوعی",
  "artificial intelligence": "هوش مصنوعی",
  programming: "برنامه نویسی",
  coding: "برنامه نویسی",
  development: "برنامه نویسی",
  "user experience": "تجربه کاربری",
  ux: "تجربه کاربری",
  ui: "تجربه کاربری",
  gaming: "بازی سازی",
  "game development": "بازی سازی",
  hardware: "سخت افزار",
  software: "نرم افزار",
  nano: "نانو",
  fintech: "فین‌تک",
  "fin tech": "فین‌تک",
  marketing: "مارکتینگ",
  branding: "برندینگ",
  sales: "فروش",
  "project management": "مدیریت پروژه",
  mba: "MBA",
  accounting: "حسابداری",
  banking: "بانکداری",
  investment: "سرمایه گذاری",
  investing: "سرمایه گذاری",
  "stock market": "بورس",
  insurance: "بیمه و ممیزی",
  "real estate": "املاک و مستغلات",
  psychology: "روانشناسی",
  law: "حقوق و قوانین",
  legal: "حقوق و قوانین",
  sociology: "جامعه شناسی",
  history: "تاریخ",
  philosophy: "فلسفه و منطق",
  "graphic design": "گرافیک",
  design: "طراحی و نقاشی",
  painting: "طراحی و نقاشی",
  film: "فیلم",
  cinema: "فیلم",
  music: "موسیقی",
  literature: "شعر و ادبیات",
  poetry: "شعر و ادبیات",
  theater: "تئاتر",
  theatre: "تئاتر",
  animation: "انیمیشن",
  fashion: "طراحی مد و لباس",
  "book reading": "کتاب‌خوانی",
  reading: "کتاب‌خوانی",
  children: "کودک و نوجوان",
  kids: "کودک و نوجوان",
  festival: "جشنواره",
  physics: "فیزیک",
  astronomy: "نجوم",
  chemistry: "شیمی",
  biology: "زیست",
  tour: "تور",
  trip: "مسافرت",
  nature: "طبیعت گردی",
  hotel: "هتلداری",
  immigration: "مهاجرت",
  fitness: "تناسب اندام",
  climbing: "کوه نوردی و صخره‌نوردی",
  "martial arts": "ورزش‌های رزمی",
};

const CITY_ALIAS_MAP = new Map(
  Object.entries(CITY_ALIASES).map(([alias, canonical]) => [compact(alias), compact(canonical)]),
);

const CATEGORY_ALIAS_MAP = new Map(
  Object.entries(CATEGORY_ALIASES).map(([alias, canonical]) => [compact(alias), compact(canonical)]),
);

function withoutLeadingDecorations(value: string): string {
  return compact(value)
    .replace(/^شهر/, "")
    .replace(/^(?:cityof|city|in\s+)/, "")
    .replace(/(?:شهر|city)$/, "");
}

function exactCityMatch(cities: City[], needle: string): City | undefined {
  return cities.find(
    (city) =>
      compact(city.name) === needle ||
      compact(city.slug) === needle ||
      compact(city.name) === CITY_ALIAS_MAP.get(needle) ||
      compact(city.slug) === CITY_ALIAS_MAP.get(needle),
  );
}

export function resolveCity(cities: City[], input: string): City | null {
  const raw = input.trim();
  if (!raw) return null;

  const needle = compact(raw);
  const undecorated = withoutLeadingDecorations(raw);

  for (const candidate of [needle, undecorated]) {
    if (!candidate) continue;
    const exact = exactCityMatch(cities, candidate);
    if (exact) return exact;

    const alias = CITY_ALIAS_MAP.get(candidate);
    if (alias) {
      const viaAlias = cities.find(
        (city) => compact(city.name) === alias || compact(city.slug) === alias,
      );
      if (viaAlias) return viaAlias;
    }
  }

  if (needle.length >= 3) {
    const partial = cities.find((city) => {
      const name = compact(city.name);
      return name.includes(needle) || needle.includes(name);
    });
    if (partial) return partial;
  }

  return null;
}

function categoryMatches(category: FlatCategory, needle: string): boolean {
  return (
    compact(category.title) === needle ||
    compact(category.slug) === needle ||
    compact(category.title) === CATEGORY_ALIAS_MAP.get(needle)
  );
}

export function resolveCategory(categories: FlatCategory[], input: string): FlatCategory | null {
  const raw = input.trim();
  if (!raw) return null;

  const needle = compact(raw);

  // Exact match first, so an explicit slug always wins.
  const exact = categories.find(
    (category) => compact(category.slug) === needle || compact(category.title) === needle,
  );
  if (exact) return exact;

  const alias = CATEGORY_ALIAS_MAP.get(needle) ?? CATEGORY_ALIAS_MAP.get(withoutLeadingDecorations(raw));
  if (alias) {
    const viaAlias = categories.find((category) => compact(category.title) === alias);
    if (viaAlias) return viaAlias;
  }

  if (needle.length >= 3) {
    return (
      categories.find((category) => {
        const title = compact(category.title);
        return title.includes(needle) || needle.includes(title);
      }) ?? null
    );
  }

  return null;
}

const CITY_ENGLISH_NAMES = (() => {
  const names = new Map<string, string>();
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    const key = compact(canonical);
    if (!names.has(key)) names.set(key, alias);
  }
  return names;
})();

export function suggestCities(cities: City[], input: string, limit = 8): string[] {
  const needle = compact(input);
  const matching = cities.filter(
    (city) =>
      (needle && (compact(city.name).includes(needle) || compact(city.slug).includes(needle))) ||
      (city.events_count ?? 0) > 0,
  );

  const pool = matching.length > 0 ? matching : cities;
  return pool
    .slice()
    .sort((a, b) => (b.events_count ?? 0) - (a.events_count ?? 0))
    .slice(0, limit)
    .map((city) => {
      const english = CITY_ENGLISH_NAMES.get(compact(city.name));
      return english ? `${city.name} / ${english} (${city.slug})` : `${city.name} (${city.slug})`;
    });
}

export function suggestCategories(categories: FlatCategory[], input: string, limit = 8): string[] {
  const needle = compact(input);
  const matching = categories.filter(
    (category) =>
      needle &&
      (compact(category.title).includes(needle) || compact(category.slug).includes(needle)),
  );

  const pool = matching.length > 0 ? matching : categories.filter((category) => category.parentTitle === null);
  return pool
    .slice(0, limit)
    .map((category) =>
      category.parentTitle
        ? `${category.title} (${category.slug}) — ${category.parentTitle}`
        : `${category.title} (${category.slug})`,
    );
}
