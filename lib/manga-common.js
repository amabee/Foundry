// Copyright (c) 2026 Vestra contributors. MIT.
export function text(value) {
  return String(value ?? "").replace(/<[^>]*>/g, " ").replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (raw, key) => {
    if (key[0] !== "#") return ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:" "})[key.toLowerCase()];
    const number = key[1].toLowerCase() === "x" ? parseInt(key.slice(2),16) : Number(key.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
  }).replace(/\s+/g," ").trim();
}
export function attrs(value) {
  const out = {};
  for (const m of String(value).matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) out[m[1].toLowerCase()] = text(m[2] ?? m[3] ?? m[4]);
  return out;
}
export function links(html) { return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)].map(m=>({ ...attrs(m[1]), body:m[2], text:text(m[2]) })); }
export function images(html) { return [...html.matchAll(/<img\b([^>]*)>/gi)].map(m=>attrs(m[1])); }
export function hasClass(attributes, name) { return String(attributes.class??"").split(/\s+/).includes(name); }
export function elements(html, tag, predicate=()=>true) {
  if(!/^[a-z][a-z0-9-]*$/.test(tag))throw Error("Invalid HTML element selector.");
  const tokens=new RegExp(`<(/?)${tag}\\b([^>]*)>`,"gi"),stack=[],rows=[];let match;
  while((match=tokens.exec(html))) {
    if(!match[1]) { if(stack.length>1000)throw Error("Source HTML is too deeply nested.");const attributes=attrs(match[2]);stack.push({attributes,start:tokens.lastIndex,offset:match.index,selected:predicate(attributes)}); }
    else {const entry=stack.pop();if(entry?.selected)rows.push({...entry,body:html.slice(entry.start,match.index)});}
  }
  return rows.sort((a,b)=>a.offset-b.offset);
}
export function meta(html, name) { for(const m of html.matchAll(/<meta\b([^>]*)>/gi)){const a=attrs(m[1]);if(a.property===name||a.name===name)return a.content ?? "";}return ""; }
export function url(raw, origin) {
  let value = String(raw ?? "").replace(/&amp;/g,"&").trim();
  if(value.startsWith("//"))value="https:"+value;
  else if(value.startsWith("/"))value=origin+value;
  if(value.length>4096 || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  const match=/^https:\/\/([a-z0-9]+(?:[.-][a-z0-9]+)*)(\/[^#]*)?$/i.exec(value);
  if(!match)return null;
  // Reject encoded separators/traversal in source identities before a URL parser can normalize them.
  let decoded;
  try {decoded=decodeURIComponent((match[2]??"/").split("?")[0]);}catch{return null;}
  if(/(?:^|\/)\.{1,2}(?:\/|$)|[\\\u0000-\u001f]/.test(decoded))return null;
  return {value,host:match[1].toLowerCase(),path:match[2]??"/"};
}
export function sourceId(raw, origin, pattern) {
  const parsed=url(raw,origin);
  if(!parsed || parsed.value!==origin+parsed.path || !pattern.test(parsed.path))throw Error("Invalid identity for this manga source.");
  return parsed.path;
}
export function pageOptions(options={}) {
  const page=options.page??1,limit=options.limit??24;
  if(!Number.isInteger(page)||page<1||page>1000||!Number.isInteger(limit)||limit<1||limit>400)throw Error("Invalid manga search pagination.");
  return {page,limit:Math.min(50,limit)};
}
export function asset(raw, origin, allowed, referer) {
  const parsed=url(raw,origin);
  return parsed && allowed.includes(parsed.host) ? {url:parsed.value,headers:{Referer:referer}} : null;
}
export function pages(raw, origin, allowed, referer) {
  if(!Array.isArray(raw)||!raw.length||raw.length>2000)throw Error("The source did not return a valid page list.");
  return raw.map((row,index)=>{const entry=asset(row,origin,allowed,referer);if(!entry)throw Error("The source returned an unapproved image host. Check for an extension update.");return {...entry,index};});
}
export function chapters(rows,language) {
  const unique=new Map();
  for(const row of rows){if(!row.id||unique.has(row.id))continue;const match=String(row.title).match(/(?:chapter|chapitre|cap[ií]tulo|глава|ch\.?)[\s.:-]*(\d+(?:[.-]\d+)?)/i)??String(row.id).match(/(?:chapter[-/]|\/c)(\d+(?:[.-]\d+)?)/i);const number=match?match[1].replace("-","."):"Special";unique.set(row.id,{id:row.id,title:text(row.title).slice(0,500),number,language});}
  if(unique.size>10000)throw Error("The source returned too many chapters.");
  return [...unique.values()].sort((a,b)=>{const an=Number(a.number),bn=Number(b.number);return Number.isFinite(an)&&Number.isFinite(bn)?an-bn:Number.isFinite(an)?-1:Number.isFinite(bn)?1:0;}).map((row,index)=>({...row,index}));
}
export function reader(host,origin) {
  return async(path,json=false)=>{
    const response=await host.fetch({url:origin+path,method:"GET",headers:{Accept:json?"application/json":"text/html",Referer:origin+"/"}});
    if(response.status!==200)throw Error(`Source returned HTTP ${response.status}.`);
    if(typeof response.body!=="string"||response.body.length>4*1024*1024)throw Error("Source metadata exceeds its size limit.");
    if(/cf-chl-|<title[^>]*>\s*(?:Just a moment|Attention Required)/i.test(response.body))throw Error("The source requires browser verification.");
    if(!json)return response.body;
    try{return JSON.parse(response.body);}catch{throw Error("The source returned invalid JSON.");}
  };
}
