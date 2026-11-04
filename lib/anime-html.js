import {request,sourcePath,titles,episodes,links,images,elements,hasClass,text,mediaUrl} from "./anime-common.js";
/** Native HTML source plumbing; site-specific selectors and extraction stay explicit. */
export function htmlAnime(config,{host}) {
 const origin=config.origin,fetch=request(host,origin),read=(path,options={})=>fetch(path,{...options,headers:{...(config.headers??{}),...options.headers}});
 return{
  async search(query,options={}){const q=String(query).trim().slice(0,500);if(!q)return[];const html=await read(config.searchPath(q)),rows=[];
   for(const block of config.cards(html)){const a=links(block.body).find(a=>{try{sourcePath(a.href,origin,config.bookPattern);return true;}catch{return false;}});if(!a)continue;const path=sourcePath(a.href,origin,config.bookPattern),img=images(a.body)[0],title=text(a.title||elements(a.body,'div',a=>hasClass(a,'tt'))[0]?.body||img?.alt||a.text);if(!title)continue;let cover;try{if(img?.src)cover=mediaUrl(img.src,origin);}catch{}rows.push({id:path,title:config.title?config.title(title,block):title,url:origin+path,...(cover?{cover}:{})});}
   return titles(rows,options.limit);},
  async getEpisodes(value){const book=sourcePath(value,origin,config.bookPattern),html=await read(book),rows=[];
   for(const a of config.episodeLinks(html)){let path;try{path=sourcePath(a.href,origin,config.episodePattern);}catch{continue;}const number=config.number(a),title=config.episodeTitle?.(a)??(text(elements(a.body,'div',a=>hasClass(a,'epl-title'))[0]?.body)||`Episode ${number}`);if(!Number.isFinite(number))continue;rows.push({id:path,number,title,url:origin+path});}return episodes(rows,book);},
  async getStreams(value,options={}){return config.streams(sourcePath(value,origin,config.episodePattern),read,options);},
 };
}
