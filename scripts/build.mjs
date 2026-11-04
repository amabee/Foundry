import { build } from "esbuild";
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
console.log("Built KissKH. Other sources are authored as standalone index.js modules.");

for (const name of ["hentai2read","hentaiera","mangabuddy","mangakatana","mangahub","asurascans","atsumaru","fanfox","kuramanga","lelmanga","mangafreak","ravenscans","mangastash","manganato"]) await build({absWorkingDir:root,entryPoints:[`extensions/${name}/src/source.js`],outfile:`extensions/${name}/index.js`,bundle:true,format:"esm",platform:"neutral",target:"es2020",legalComments:"inline"});
