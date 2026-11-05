import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { readState, writeState, filterEntries, safeUrl } from "./model.js";
const data = JSON.parse(
  await readFile(new URL("./dist/catalogue.json", import.meta.url), "utf8"),
);
test("published site catalogue matches the registry and omits blocked sources", async () => {
  const registry = JSON.parse(
    await readFile(
      new URL("../extensions/registry.json", import.meta.url),
      "utf8",
    ),
  );
  assert.deepEqual(
    data.entries.map((e) => e.id),
    registry.map((e) => e.id),
  );
  assert.equal(
    data.entries.some((e) => e.id === "vestra-streamflix"),
    false,
  );
  for (const e of data.entries) {
    assert.match(e.manifestURI, /Foundry\/[a-f0-9]{40}\/extensions\//);
    if (e.icon)
      assert.ok(
        (await stat(join(import.meta.dirname, "dist", e.icon))).size > 0,
      );
  }
});
test("default browsing hides adult sources and keeps honest experimental status", () => {
  const s = readState("");
  assert.equal(
    filterEntries(data.entries, s).some((e) => e.adult),
    false,
  );
  const all = filterEntries(data.entries, { ...s, adult: true });
  assert.equal(all.length, data.entries.length);
  assert.ok(all.some((e) => e.status === "experimental" && e.reason));
  assert.equal(
    filterEntries(all, { ...s, adult: true, experimental: false }).some(
      (e) => e.status === "experimental",
    ),
    false,
  );
});
test("filters combine without limiting catalogue results", () => {
  const s = { ...readState(""), category: "manga", q: "Manga", lang: "en" };
  const rows = filterEntries(data.entries, s);
  assert.ok(rows.length > 0);
  assert.ok(rows.every((e) => e.category === "manga" && e.lang === "en"));
  assert.equal(
    filterEntries(data.entries, { ...s, q: "no-such-source-123" }).length,
    0,
  );
  assert.equal(filterEntries(data.entries, { ...s, tab: "plugins" }).length, 0);
});
test("URL state round trips disabled experimental and adult opt-in", () => {
  const state = {
    ...readState(""),
    experimental: false,
    adult: true,
    category: "manga",
    q: "a & b",
    sort: "za",
    item: "vestra-mangadex",
  };
  assert.deepEqual(readState(writeState(state)), state);
  assert.equal(readState("?tab=bad&category=bad").tab, "extensions");
  assert.equal(readState("?category=bad").category, "all");
});
test("install links never accept executable or insecure URLs", () => {
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("http://example.com"), null);
  for (const e of data.entries) assert.ok(safeUrl(e.manifestURI));
});
