import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
export const root = fileURLToPath(new URL("../", import.meta.url));
export const repository = "amabee/Foundry";
export const catalogue = JSON.parse(await readFile(new URL("../catalogue.json", import.meta.url), "utf8"));
export function resolveRevision(ref) {
  const revision = execFileSync("git", ["rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`], { cwd: root, encoding: "utf8" }).trim();
  if (!/^[0-9a-f]{40}$/.test(revision)) throw Error("Registry publication needs a complete commit SHA.");
  return revision;
}
export function pinnedFile(revision, folder, file) {
  if (!/^[0-9a-f]{40}$/.test(revision) || !Object.hasOwn(catalogue, folder) || !["manifest.json", "index.js"].includes(file)) throw Error("Invalid pinned source path.");
  return execFileSync("git", ["show", `${revision}:extensions/${folder}/${file}`], { cwd: root });
}
export function registryEntries(revision) {
  return Object.entries(catalogue).filter(([, policy]) => policy.status !== "blocked").map(([folder, policy]) => {
    const manifest = JSON.parse(pinnedFile(revision, folder, "manifest.json").toString("utf8"));
    const base = `https://raw.githubusercontent.com/${repository}/${revision}/extensions/${folder}`;
    const experimental = policy.status === "experimental";
    return {
      id: manifest.id, name: manifest.name, version: manifest.version,
      author: manifest.author, description: (experimental ? `Experimental: ${policy.reason ?? "upstream playback checks have failed."} ` : "") + manifest.description,
      type: manifest.role === "manga-source" ? "manga-provider" : "custom-source", language: "javascript", lang: policy.lang ?? "multi", icon: manifest.icon ?? "",
      manifestURI: `${base}/manifest.json`, payloadURI: `${base}/${manifest.main}`,
      website: `https://github.com/${repository}/tree/${revision}/extensions/${folder}`,
      tags: ["vestra", "foundry", "native", ...(experimental ? ["experimental"] : [])],
      workingTag: policy.previouslyVerified === true,
      brokenTag: experimental,
      lastWorkingVersion: policy.previouslyVerified ? manifest.version : null,
      kinds: manifest.role === "manga-source" ? ["manga"] : manifest.kinds,
    };
  });
}
