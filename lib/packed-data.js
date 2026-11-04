import { literal } from "./anime-common.js";
/** Decode the standard public packer's string table. Never evaluate its program. */
export function unpackData(html) {
  const quoted = "(\"(?:[^\"\\\\]|\\\\.)*\"|'(?:[^'\\\\]|\\\\.)*')";
  const re = new RegExp(
    "\\}\\s*\\(\\s*" +
      quoted +
      "\\s*,\\s*(\\d+)\\s*,\\s*(\\d+)\\s*,\\s*" +
      quoted +
      "\\.split\\([\"']\\|[\"']\\)",
    "g",
  );
  const results = [];
  for (const m of html.matchAll(re)) {
    const radix = Number(m[2]),
      count = Number(m[3]);
    if (radix < 2 || radix > 62 || count > 10000)
      throw Error("Packed source data exceeds its limit.");
    const payload = literal(m[1]),
      table = literal(m[4]).split("|"),
      alphabet =
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let size = 0;
    const decoded = payload.replace(/\b[0-9a-zA-Z]+\b/g, (word) => {
      let n = 0;
      for (const c of word) {
        const digit = alphabet.indexOf(c);
        if (digit < 0 || digit >= radix) return word;
        n = n * radix + digit;
        if (n >= count) return word;
      }
      const value = table[n] || word;
      size += value.length;
      if (size > 1024 * 1024)
        throw Error("Unpacked source data exceeds its limit.");
      return value;
    });
    results.push(decoded);
    if (results.length > 10) throw Error("Too many packed source blocks.");
  }
  return results.join("\n");
}
