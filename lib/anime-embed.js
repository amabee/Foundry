import {attrs,literal,url,rendition,result} from './anime-common.js';
export function frames(html){return[...html.matchAll(/<iframe\b([^>]*)>/gi)].map(m=>attrs(m[1]).src).filter(Boolean);}
/** Literal media fields or nested approved iframes, never downloaded/evaluated JS. */
export async function extractPlayer(start,read,{origin,hosts,server,headers={},typeHint}={}) {
 let current=start;const visited=new Set();
 for(let depth=0;depth<4;depth++){
  const target=url(current,origin);if(!target||!hosts.includes(target.host)||visited.has(target.value))throw Error('Unapproved or repeated anime player URL.');visited.add(target.value);
  const html=(await read(target.value)).replace(/<!--[\s\S]*?-->/g,''),videos=[];
  const literals=[...html.matchAll(/(?:\b(?:file|src)|["'](?:file|src)["'])\s*:\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g),...html.matchAll(/\b(?:var|let|const)\s+primary\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g)];
  for(const match of literals){const raw=literal(match[1]);let type;try{const inner=/[?&]src=([^&]+)/.exec(raw);if(inner&&/\.m3u8(?:[?#]|$)/i.test(decodeURIComponent(inner[1])))type='hls';}catch{}try{videos.push(rendition(raw,origin,{headers:{Referer:target.value,...headers},type:type??typeHint}));}catch{}}
  for(const match of html.matchAll(/<source\b([^>]*)>/gi)){const a=attrs(match[1]);if(a.src)try{videos.push(rendition(a.src,origin,{headers:{Referer:target.value,...headers}}));}catch{}}
  if(videos.length)return result(server,[...new Map(videos.map(v=>[v.url,v])).values()],{Referer:target.value,...headers});
  const next=frames(html).find(raw=>hosts.includes(url(raw,origin)?.host));if(!next)throw Error('Anime player did not expose supported media data.');current=next;
 }
 throw Error('Anime player exceeded its nesting limit.');
}
