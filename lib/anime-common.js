// Copyright (c) 2026 Vestra contributors. MIT.
import {url,text} from "./manga-common.js";
export {attrs,elements,links,images,meta,hasClass,text,url} from "./manga-common.js";
export function identity(value,pattern=/^[a-z0-9_-]+$/i) {
  if(typeof value!=="string"||!value.length||value.length>500||!pattern.test(value))throw Error("Invalid anime source identity.");return value;
}
export function sourcePath(value,origin,pattern) {
  const p=url(value,origin);if(!p||p.value!==origin+p.path||p.path.length>500||!pattern.test(p.path))throw Error("Invalid anime source path.");return p.path;
}
export function mediaUrl(value,origin) {
  const p=url(value,origin);if(!p||p.value.length>2048||!p.host.includes('.')||/^[\d.]+$/.test(p.host)||/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(p.host))throw Error("Invalid public HTTPS media URL.");return p.value;
}
export function request(host,origin) {
  return async(path,{json=false,method="GET",headers={},body}={})=>{
    const p=url(path,origin);if(!p)throw Error("Invalid source request.");
    const response=await host.fetch({url:p.value,method,headers:{Accept:json?"application/json":"text/html",Referer:origin+'/',...headers},...(body===undefined?{}:{body})});
    if(response.status!==200)throw Error(`Source returned HTTP ${response.status}.`);
    if(typeof response.body!=="string"||response.body.length>2*1024*1024)throw Error("Source metadata exceeds its size limit.");
    if(/cf-chl-|<title[^>]*>\s*(?:Just a moment|Attention Required)/i.test(response.body))throw Error("Source requires browser verification.");
    if(!json)return response.body;
    try{return JSON.parse(response.body);}catch{throw Error("Source returned invalid JSON.");}
  };
}
export function titles(rows,limit=50) {
  if(!Number.isInteger(limit)||limit<1||limit>50)throw Error("Invalid anime search limit.");
  const found=new Map();for(const row of rows){if(!row.id||!text(row.title))continue;found.set(row.id,{...row,title:text(row.title).slice(0,500),kind:"anime"});}
  return[...found.values()].slice(0,limit);
}
export function episodes(rows,animeId) {
  const found=new Map();for(const row of rows){if(!row.id||!Number.isFinite(row.number)||row.number<0||row.number>10000)throw Error("Invalid source episode metadata.");found.set(row.id,{...row,animeId,title:text(row.title??`Episode ${row.number}`).slice(0,500)});}
  if(found.size>5000)throw Error("Source returned too many episodes.");return[...found.values()].sort((a,b)=>a.number-b.number);
}
export function rendition(raw,origin,{quality="auto",type,headers,subtitles}={}) {
  const value=mediaUrl(raw,origin),container=type??(/\.m3u8(?:[?#]|$)/i.test(value)?"hls":/\.mp4(?:[?#]|$)/i.test(value)?"mp4":/\.mkv(?:[?#]|$)/i.test(value)?"mkv":null);
  if(!container||!["hls","mp4","mkv"].includes(container))throw Error("Source returned an embed page instead of playable media.");
  return{url:value,type:container,quality:String(quality).slice(0,60)||"auto",...(headers?{headers}:{}),...(subtitles?.length?{subtitles}:{} )};
}
export function result(server,videoSources,headers) {
  if(!videoSources.length||videoSources.length>50)throw Error("Source did not return playable media.");return{server,videoSources,...(headers?{headers}:{})};
}
/** Decode a quoted data literal, never execute the surrounding script. */
export function literal(value) {
  if(typeof value!=="string"||value.length>65536||!/^(["'])[\s\S]*\1$/.test(value))throw Error("Invalid source string literal.");
  if(value[0]==='"'){try{return JSON.parse(value);}catch{throw Error("Invalid source string literal.");}}
  let out='';for(let i=1;i<value.length-1;i++){let c=value[i];if(c==='\\'){c=value[++i];const special={n:'\n',r:'\r',t:'\t',b:'\b',f:'\f',v:'\v'};if(c==='u'||c==='x'){const size=c==='u'?4:2,hex=value.slice(i+1,i+1+size);if(!new RegExp('^[0-9a-f]{'+size+'}$','i').test(hex))throw Error("Invalid escaped source string.");out+=String.fromCharCode(parseInt(hex,16));i+=size;continue;}out+=special[c]??c;}else out+=c;}return out;
}
