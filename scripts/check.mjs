import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { isIP } from "node:net";
import { pathToFileURL } from "node:url";
import { join } from "node:path";
import { catalogue, root, registryEntries, pinnedFile } from "./registry.mjs";

const registry = JSON.parse(await readFile(join(root, "extensions/registry.json"), "utf8"));
assert.ok(Array.isArray(registry) && registry.length > 0);
const revision = new URL(registry[0].manifestURI).pathname.split("/")[3];
assert.match(revision, /^[0-9a-f]{40}$/);
assert.doesNotThrow(() => execFileSync("git", ["merge-base", "--is-ancestor", revision, "HEAD"], { cwd: root, stdio: "pipe" }), "Pinned source commits must remain reachable. Merge without squashing or rebasing.");
assert.deepEqual(registry, registryEntries(revision), "Regenerate the registry from a committed source revision.");
const folders = (await readdir(join(root, "extensions"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
assert.deepEqual(folders, Object.keys(catalogue).sort());
const ids = new Set();
let networkCalls = 0;
for (const folder of folders) {
  const manifest = JSON.parse(await readFile(join(root, "extensions", folder, "manifest.json"), "utf8"));
  assert.equal(manifest.id, `vestra-${folder}`);
  assert.ok(!ids.has(manifest.id)); ids.add(manifest.id);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.match(manifest.sdkVersion, /^1\.\d+\.\d+$/);
  assert.equal(manifest.role, "stream-source");
  assert.equal(manifest.main, "index.js");
  assert.ok(manifest.hosts.length > 0 && manifest.hosts.length <= 256);
  for (const host of manifest.hosts) assert.ok(/^[a-z0-9]+(?:[.-][a-z0-9]+)*$/.test(host) && host.includes(".") && !isIP(host), `Invalid host grant: ${host}`);
  for (const permission of manifest.permissions) assert.ok(["network", "network:session"].includes(permission));
  for (const kind of manifest.kinds) assert.ok(["movie", "tv"].includes(kind));
  if (catalogue[folder].status !== "blocked") {
    for (const file of ["manifest.json", "index.js"])
      assert.deepEqual(await readFile(join(root, "extensions", folder, file)), pinnedFile(revision, folder, file), `Commit ${folder}/${file} before publishing its registry entry.`);
  }
  const source = await import(pathToFileURL(join(root, "extensions", folder, "index.js")).href);
  assert.equal(typeof source.activate, "function");
  const provider = await source.activate({ host: {
    extensionId: manifest.id, log() {},
    async fetch() { networkCalls++; throw Error("Activation must not access the network."); },
  } });
  for (const method of ["search", "getEpisodes", "getStreams"]) assert.equal(typeof provider[method], "function", `${manifest.id} lacks ${method}`);
  if (manifest.discovery) assert.equal(typeof provider.browse, "function", `${manifest.id} lacks browse`);
  if (manifest.catalogueSource === "tmdb") assert.equal(typeof provider.matchCatalogue, "function");
}
assert.equal(networkCalls, 0);
assert.ok(!registry.some((entry) => entry.id === "vestra-streamflix"));
assert.ok(registry.find((entry) => entry.id === "vestra-vidlink").brokenTag);
console.log(`PASS ${folders.length} manifests and offline activations, ${registry.length} immutable listings, host grants, reproducible payloads and blocked/experimental policies`);
