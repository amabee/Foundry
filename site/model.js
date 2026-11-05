export const categories = {
  all: "All extensions",
  anime: "Anime",
  manga: "Manga",
  screen: "Movies & TV",
};
export const languageNames = {
  en: "English",
  multi: "Multilingual",
  fr: "French",
  de: "German",
  id: "Indonesian",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  es: "Spanish",
  ja: "Japanese",
};
export function readState(search) {
  const p = new URLSearchParams(search);
  return {
    tab: p.get("tab") === "plugins" ? "plugins" : "extensions",
    q: (p.get("q") || "").slice(0, 200),
    category: Object.hasOwn(categories, p.get("category"))
      ? p.get("category")
      : "all",
    lang: (p.get("lang") || "all").slice(0, 30),
    experimental: p.get("experimental") !== "0",
    adult: p.get("adult") === "1",
    sort: p.get("sort") === "za" ? "za" : "az",
    item: p.get("item") || "",
  };
}
export function filterEntries(entries, s) {
  const q = s.q.trim().toLocaleLowerCase();
  return entries
    .filter(
      (e) =>
        e.group === s.tab &&
        (s.adult || !e.adult) &&
        (s.experimental || e.status !== "experimental") &&
        (s.category === "all" || e.category === s.category) &&
        (s.lang === "all" || e.lang === s.lang) &&
        (!q ||
          [
            e.name,
            e.description,
            languageNames[e.lang] || e.lang,
            e.author,
            ...(e.tags || []),
          ]
            .join(" ")
            .toLocaleLowerCase()
            .includes(q)),
    )
    .sort((a, b) => (s.sort === "za" ? -1 : 1) * a.name.localeCompare(b.name));
}
export function safeUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.href : null;
  } catch {
    return null;
  }
}
export function writeState(s) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(s)) {
    if (
      (k === "tab" && v === "extensions") ||
      (k === "category" && v === "all") ||
      (k === "lang" && v === "all") ||
      (k === "sort" && v === "az") ||
      (k === "experimental" && v === true) ||
      (k === "adult" && v === false) ||
      v === "" ||
      v == null
    )
      continue;
    p.set(k, k === "experimental" ? "0" : k === "adult" ? "1" : v);
  }
  return p.size ? "?" + p.toString() : globalThis.location?.pathname || "/";
}
