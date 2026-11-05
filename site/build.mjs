import {
  readFile,
  mkdir,
  copyFile,
  writeFile,
  readdir,
  cp,
} from "node:fs/promises";
import { join, resolve } from "node:path";
const site = import.meta.dirname,
  repo = resolve(site, ".."),
  dist = join(site, "dist");
await mkdir(join(dist, "assets"), { recursive: true });
await cp(join(site, "assets"), join(dist, "assets"), { recursive: true });
for (const name of [
  "index.html",
  "style.css",
  "tokens.css",
  "base.css",
  "app.js",
  "model.js",
  "favicon.svg",
])
  await copyFile(join(site, name), join(dist, name));
const registry = JSON.parse(
  await readFile(join(repo, "extensions/registry.json"), "utf8"),
);
const policy = JSON.parse(await readFile(join(repo, "catalogue.json"), "utf8"));
const folders = await readdir(join(repo, "extensions"), {
  withFileTypes: true,
});
const manifests = new Map();
for (const folder of folders.filter((f) => f.isDirectory())) {
  try {
    const manifest = JSON.parse(
      await readFile(
        join(repo, "extensions", folder.name, "manifest.json"),
        "utf8",
      ),
    );
    manifests.set(manifest.id, { manifest, folder: folder.name });
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}
const entries = [];
for (const row of registry) {
  const record = manifests.get(row.id);
  if (!record) throw Error("Missing manifest: " + row.id);
  const { manifest, folder } = record;
  const status = policy[folder]?.status;
  if (status === "blocked")
    throw Error("Blocked listing in published registry: " + folder);
  let icon = null;
  const localFiles = await readdir(join(repo, "extensions", folder));
  const local = localFiles.find((n) =>
    /^icon\.(webp|png|jpg|svg|ico)$/.test(n),
  );
  if (local) {
    icon = "./assets/" + folder + "-" + local;
    await copyFile(
      join(repo, "extensions", folder, local),
      join(dist, "assets", folder + "-" + local),
    );
  }
  entries.push({
    ...row,
    icon,
    group:
      row.type === "plugin" || manifest.role === "plugin"
        ? "plugins"
        : "extensions",
    category:
      manifest.role === "manga-source"
        ? "manga"
        : row.type === "onlinestream-provider"
          ? "anime"
          : "screen",
    adult: /18\+|hentai|adult/i.test([row.name, ...(row.tags || [])].join(" ")),
    status: status || "experimental",
    reason: policy[folder]?.reason || null,
    permissions: manifest.permissions || [],
    hosts: manifest.hosts || [],
    sdkVersion: manifest.sdkVersion || null,
  });
}
await writeFile(
  join(dist, "catalogue.json"),
  JSON.stringify(
    {
      registryUrl:
        "https://raw.githubusercontent.com/amabee/Foundry/main/extensions/registry.json",
      entries,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Built Foundry marketplace: " + entries.length + " published listings.",
);
