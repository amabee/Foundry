// lib/manga-common.js
function text(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, key) => {
    if (key[0] !== "#") return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " }[key.toLowerCase()];
    const number = key[1].toLowerCase() === "x" ? parseInt(key.slice(2), 16) : Number(key.slice(1));
    return number > 0 && number <= 1114111 ? String.fromCodePoint(number) : "";
  }).replace(/\s+/g, " ").trim();
}
function attrs(value) {
  const out = {};
  for (const m of String(value).matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[m[1].toLowerCase()] = text(m[2] ?? m[3] ?? m[4]);
  return out;
}
function links(html) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map((m) => ({ ...attrs(m[1]), body: m[2], text: text(m[2]), offset: m.index }));
}
function images(html) {
  return [...html.matchAll(/<img\b([^>]*)>/gi)].map((m) => attrs(m[1]));
}
function hasClass(attributes, name) {
  return String(attributes.class ?? "").split(/\s+/).includes(name);
}
function elements(html, tag, predicate = () => true) {
  if (!/^[a-z][a-z0-9-]*$/.test(tag)) throw Error("Invalid HTML element selector.");
  const tokens = new RegExp(`<(/?)${tag}\\b([^>]*)>`, "gi"), stack = [], rows = [];
  let match;
  while (match = tokens.exec(html)) {
    if (!match[1]) {
      if (stack.length > 1e3) throw Error("Source HTML is too deeply nested.");
      const attributes = attrs(match[2]);
      stack.push({ attributes, start: tokens.lastIndex, offset: match.index, selected: predicate(attributes) });
    } else {
      const entry = stack.pop();
      if (entry?.selected) rows.push({ ...entry, body: html.slice(entry.start, match.index) });
    }
  }
  return rows.sort((a, b) => a.offset - b.offset);
}
function url(raw, origin) {
  let value = String(raw ?? "").replace(/&amp;/g, "&").trim();
  if (value.startsWith("//")) value = "https:" + value;
  else if (value.startsWith("/")) value = origin + value;
  if (value.length > 4096 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  const match = /^https:\/\/([a-z0-9]+(?:[.-][a-z0-9]+)*)(\/[^#]*)?$/i.exec(value);
  if (!match) return null;
  let decoded;
  try {
    decoded = decodeURIComponent((match[2] ?? "/").split("?")[0]);
  } catch {
    return null;
  }
  if (/(?:^|\/)\.{1,2}(?:\/|$)|[\\\u0000-\u001f]/.test(decoded)) return null;
  return { value, host: match[1].toLowerCase(), path: match[2] ?? "/" };
}

// lib/anime-common.js
function sourcePath(value, origin, pattern) {
  const p = url(value, origin);
  if (!p || p.value !== origin + p.path || p.path.length > 500 || !pattern.test(p.path)) throw Error("Invalid anime source path.");
  return p.path;
}
function mediaUrl(value, origin) {
  const p = url(value, origin);
  if (!p || p.value.length > 2048 || !p.host.includes(".") || /^[\d.]+$/.test(p.host) || /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(p.host)) throw Error("Invalid public HTTPS media URL.");
  return p.value;
}
function request(host, origin) {
  return async (path, { json = false, method = "GET", headers = {}, body } = {}) => {
    const p = url(path, origin);
    if (!p) throw Error("Invalid source request.");
    const response = await host.fetch({ url: p.value, method, headers: { Accept: json ? "application/json" : "text/html", Referer: origin + "/", ...headers }, ...body === void 0 ? {} : { body } });
    if (response.status !== 200) throw Error(`Source returned HTTP ${response.status}.`);
    if (typeof response.body !== "string" || response.body.length > 2 * 1024 * 1024) throw Error("Source metadata exceeds its size limit.");
    if (/cf-chl-|<title[^>]*>\s*(?:Just a moment|Attention Required)/i.test(response.body)) throw Error("Source requires browser verification.");
    if (!json) return response.body;
    try {
      return JSON.parse(response.body);
    } catch {
      throw Error("Source returned invalid JSON.");
    }
  };
}
function titles(rows, limit = 50) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw Error("Invalid anime search limit.");
  const found = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!row.id || !text(row.title)) continue;
    found.set(row.id, { ...row, title: text(row.title).slice(0, 500), kind: "anime" });
  }
  return [...found.values()].slice(0, limit);
}
function episodes(rows, animeId) {
  const found = /* @__PURE__ */ new Map();
  for (const row of rows) {
    if (!row.id || !Number.isFinite(row.number) || row.number < 0 || row.number > 1e4) throw Error("Invalid source episode metadata.");
    found.set(row.id, { ...row, animeId, title: text(row.title ?? `Episode ${row.number}`).slice(0, 500) });
  }
  if (found.size > 5e3) throw Error("Source returned too many episodes.");
  return [...found.values()].sort((a, b) => a.number - b.number);
}
function rendition(raw, origin, { quality = "auto", type, headers, subtitles } = {}) {
  const value = mediaUrl(raw, origin), container = type ?? (/\.m3u8(?:[?#]|$)/i.test(value) ? "hls" : /\.mp4(?:[?#]|$)/i.test(value) ? "mp4" : /\.mkv(?:[?#]|$)/i.test(value) ? "mkv" : null);
  if (!container || !["hls", "mp4", "mkv"].includes(container)) throw Error("Source returned an embed page instead of playable media.");
  return { url: value, type: container, quality: String(quality).slice(0, 60) || "auto", ...headers ? { headers } : {}, ...subtitles?.length ? { subtitles } : {} };
}
function result(server, videoSources, headers) {
  if (!videoSources.length || videoSources.length > 50) throw Error("Source did not return playable media.");
  return { server, videoSources, ...headers ? { headers } : {} };
}
function literal(value) {
  if (typeof value !== "string" || value.length > 65536 || !/^(["'])[\s\S]*\1$/.test(value)) throw Error("Invalid source string literal.");
  if (value[0] === '"') {
    try {
      return JSON.parse(value);
    } catch {
      throw Error("Invalid source string literal.");
    }
  }
  let out = "";
  for (let i = 1; i < value.length - 1; i++) {
    let c = value[i];
    if (c === "\\") {
      c = value[++i];
      const special = { n: "\n", r: "\r", t: "	", b: "\b", f: "\f", v: "\v" };
      if (c === "u" || c === "x") {
        const size = c === "u" ? 4 : 2, hex = value.slice(i + 1, i + 1 + size);
        if (!new RegExp("^[0-9a-f]{" + size + "}$", "i").test(hex)) throw Error("Invalid escaped source string.");
        out += String.fromCharCode(parseInt(hex, 16));
        i += size;
        continue;
      }
      out += special[c] ?? c;
    } else out += c;
  }
  return out;
}

// lib/anime-html.js
function htmlAnime(config, { host }) {
  const origin = config.origin, fetch = request(host, origin), read = (path, options = {}) => fetch(path, { ...options, headers: { ...config.headers ?? {}, ...options.headers } });
  return {
    async search(query, options = {}) {
      const q = String(query).trim().slice(0, 500);
      if (!q) return [];
      const html = await read(config.searchPath(q)), rows = [];
      for (const block of config.cards(html)) {
        const a = links(block.body).find((a2) => {
          try {
            sourcePath(a2.href, origin, config.bookPattern);
            return true;
          } catch {
            return false;
          }
        });
        if (!a) continue;
        const path = sourcePath(a.href, origin, config.bookPattern), img = images(a.body)[0], title = text(a.title || elements(a.body, "div", (a2) => hasClass(a2, "tt"))[0]?.body || img?.alt || a.text);
        if (!title) continue;
        let cover;
        try {
          if (img?.src) cover = mediaUrl(img.src, origin);
        } catch {
        }
        rows.push({ id: path, title: config.title ? config.title(title, block) : title, url: origin + path, ...cover ? { cover } : {} });
      }
      return titles(rows, options.limit);
    },
    async getEpisodes(value) {
      const book = sourcePath(value, origin, config.bookPattern), html = await read(book), rows = [];
      for (const a of config.episodeLinks(html)) {
        let path;
        try {
          path = sourcePath(a.href, origin, config.episodePattern);
        } catch {
          continue;
        }
        const number = config.number(a), title = config.episodeTitle?.(a) ?? (text(elements(a.body, "div", (a2) => hasClass(a2, "epl-title"))[0]?.body) || `Episode ${number}`);
        if (!Number.isFinite(number)) continue;
        rows.push({ id: path, number, title, url: origin + path });
      }
      return episodes(rows, book);
    },
    async getStreams(value, options = {}) {
      return config.streams(sourcePath(value, origin, config.episodePattern), read, options);
    }
  };
}

// lib/anime-embed.js
function frames(html) {
  return [...html.matchAll(/<iframe\b([^>]*)>/gi)].map((m) => attrs(m[1]).src).filter(Boolean);
}
async function extractPlayer(start, read, { origin, hosts, server, headers = {}, typeHint } = {}) {
  let current = start;
  const visited = /* @__PURE__ */ new Set();
  for (let depth = 0; depth < 4; depth++) {
    const target = url(current, origin);
    if (!target || !hosts.includes(target.host) || visited.has(target.value)) throw Error("Unapproved or repeated anime player URL.");
    visited.add(target.value);
    const html = (await read(target.value)).replace(/<!--[\s\S]*?-->/g, ""), videos = [];
    const literals = [...html.matchAll(/(?:\b(?:file|src)|["'](?:file|src)["'])\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g), ...html.matchAll(/\b(?:var|let|const)\s+primary\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)];
    for (const match of literals) {
      const raw = literal(match[1]);
      let type;
      try {
        const inner = /[?&]src=([^&]+)/.exec(raw);
        if (inner && /\.m3u8(?:[?#]|$)/i.test(decodeURIComponent(inner[1]))) type = "hls";
      } catch {
      }
      try {
        videos.push(rendition(raw, origin, { headers: { Referer: target.value, ...headers }, type: type ?? typeHint }));
      } catch {
      }
    }
    for (const match of html.matchAll(/<source\b([^>]*)>/gi)) {
      const a = attrs(match[1]);
      if (a.src) try {
        videos.push(rendition(a.src, origin, { headers: { Referer: target.value, ...headers } }));
      } catch {
      }
    }
    if (videos.length) return result(server, [...new Map(videos.map((v) => [v.url, v])).values()], { Referer: target.value, ...headers });
    const next = frames(html).find((raw) => hosts.includes(url(raw, origin)?.host));
    if (!next) throw Error("Anime player did not expose supported media data.");
    current = next;
  }
  throw Error("Anime player exceeded its nesting limit.");
}

// extensions/animesaturnmirror/src/source.js
var ORIGIN = "https://animesaturn.ro";
function activate(context) {
  return htmlAnime({ origin: ORIGIN, headers: { "User-Agent": "Mozilla/5.0" }, searchPath: (q) => "/?s=" + encodeURIComponent(q), bookPattern: /^\/anime\/[a-z0-9_-]+\/?$/i, episodePattern: /^\/[a-z0-9_-]+-episode-\d+(?:\.\d+)?\/?$/i, cards: (html) => elements(html, "article", (a) => hasClass(a, "bs")), episodeLinks: (html) => elements(html, "div", (a) => hasClass(a, "eplister")).flatMap((b) => links(b.body)), number: (a) => Number.parseFloat(text(elements(a.body, "div", (a2) => hasClass(a2, "epl-num"))[0]?.body)), async streams(path, read, options) {
    if (options.excludeServers?.includes("AnimeSaturn")) throw Error("No untried AnimeSaturn server remains.");
    const html = await read(path), player = elements(html, "div", (a) => a.id === "pembed")[0], frame = frames(player?.body ?? "")[0];
    if (!frame) throw Error("AnimeSaturn player is missing.");
    return [await extractPlayer(frame, read, { origin: ORIGIN, hosts: ["animesaturn.ro", "cdn2.megaplay.su"], server: "AnimeSaturn" })];
  } }, context);
}
export {
  activate
};
