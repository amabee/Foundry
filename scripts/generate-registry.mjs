import { writeFile } from "node:fs/promises";
import { resolveRevision, registryEntries } from "./registry.mjs";
const revision = resolveRevision(process.argv[2] ?? "HEAD");
const entries = registryEntries(revision);
await writeFile(new URL("../extensions/registry.json", import.meta.url), JSON.stringify(entries, null, 2) + "\n");
console.log(`Generated ${entries.length} listings pinned to ${revision}. StreamFlix remains unpublished.`);
