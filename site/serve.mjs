import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
const root = resolve(import.meta.dirname, "dist");
const port = Number(process.env.PORT || 5198);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    const p = resolve(
      root,
      "." +
        decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname),
    );
    if (!p.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    const data = await readFile(p);
    res.writeHead(200, {
      "Content-Type": mime[extname(p)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log("Foundry: http://127.0.0.1:" + port),
);
