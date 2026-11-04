import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
await build({
  absWorkingDir: root,
  entryPoints: ["extensions/kisskh/src/source.js"],
  outfile: "extensions/kisskh/index.js",
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  legalComments: "inline",
});
const adapted = new Set([...JSON.parse(await readFile(new URL('../manga-ports.json', import.meta.url), 'utf8')).providers, ...JSON.parse(await readFile(new URL('../anime-ports.json', import.meta.url), 'utf8')).providers].map(p => p.folder));
const upstreamNotice = await readFile(new URL('../licenses/seanime-providers-MIT.txt', import.meta.url), 'utf8');
const cipherNotice = await readFile(new URL('../licenses/noble-ciphers-MIT.txt', import.meta.url), 'utf8');
function notice(name) { const value = (adapted.has(name) ? upstreamNotice : '') + (name === 'animeav1' ? '\n' + cipherNotice : ''); return value ? {js: '/*\n' + value.replace(/\*\//g, '* /') + '\n*/'} : undefined; }

for (const name of ["hentai2read","hentaiera","mangabuddy","mangakatana","mangahub","asurascans","atsumaru","fanfox","kuramanga","lelmanga","mangafreak","ravenscans","mangastash","manganato","komiku","mynimekumanga","mangaworldadult","animesama","taiyo","xcomic","mangaball","mangadot","mangafire","animegg","animeheaven","animesaturnmirror","animeunion","animeunitymirror","animetoast","shonen","anitube","mynimeku","donghuastream","nontonanime","animeav1","hentaisaturn","hentaiworld","shiro","aniworld","animetvplus","mangadex","weebcentral"]) await build({absWorkingDir:root,entryPoints:[`extensions/${name}/src/source.js`],outfile:`extensions/${name}/index.js`,bundle:true,format:"esm",platform:"neutral",target:"es2020",legalComments:"inline",banner:notice(name)});

console.log("Built native source payloads with their distribution license notices.");
