// Copyright (c) 2026 Vestra contributors. MIT.
// Native shared HTML source plumbing; selectors remain owned by each source.
import {reader,pageOptions,links,images,asset,chapters,pages,sourceId,url,meta,text} from "./manga-common.js";
export function createHtmlManga(host,config) {
  const {origin,hosts,bookPattern,chapterPattern}=config,originHost=origin.slice(8),read=reader(host,origin);
  const own=(href,pattern)=>{const parsed=url(href,origin);return parsed?.host===originHost&&pattern.test(parsed.path)?parsed.path:null;};
  const completeImage=raw=>typeof raw==="string"&&raw.startsWith("http://")?"https://"+raw.slice(7):raw;
  async function searchPage(query,options={}) {
    const {page}=pageOptions(options),q=String(query).trim().slice(0,500);if(!q)return{items:[],hasMore:false};
    const html=await read(config.searchPath(q,page)),found=new Map();
    for(const block of config.results(html)) {
      const selected=links(block).filter(link=>own(link.href,bookPattern));if(!selected.length)continue;
      const link=selected.find(link=>link.text)||selected[0],img=images(block)[0];
      const id=own(link.href,bookPattern),title=text(config.title?.(block)||link.title||link.text||img?.alt);if(!title)continue;
      found.set(id,{id,title:title.slice(0,500),cover:asset(completeImage(img?.["data-src"]||img?.["data-original"]||img?.src),origin,hosts,origin+"/")});
    }
    if(found.size>400)throw Error("The source returned too many search results.");
    const items=[...found.values()];
    const hasMore=items.length>0&&(config.hasMore?.(html,page)??links(html).some(link=>link.rel==="next"||new RegExp(`(?:/page/${page+1}/|[?&]page=${page+1}(?:&|$))`).test(link.href??"")));
    return {items,hasMore};
  }
  return {
    searchPage,
    async search(query,options={}){return(await searchPage(query,{...options,page:1})).items;},
    async getChapters(id) {
      const path=sourceId(id,origin,bookPattern),html=await read(config.chapterListPath?.(path)??path),rows=[];
      for(const link of config.chapterLinks(html,path)) {
        const chapter=own(link.href,chapterPattern);if(!chapter||config.belongs&&!config.belongs(chapter,path))continue;
        rows.push({id:chapter,title:link.text||`Chapter ${chapter.match(/(?:chapter[-_/]|\/c)(\d+(?:[.-]\d+)?)/i)?.[1]??"Special"}`});
      }
      return chapters(rows,config.language);
    },
    async getPages(id) {
      const path=sourceId(id,origin,chapterPattern),html=await read(path),urls=(await config.readerImages(html,path,read)).map(img=>completeImage(typeof img==="string"?img:img["data-src"]||img["data-original"]||img.src)).filter(Boolean);
      return pages(urls,origin,hosts,config.imageReferer?.(path)??origin+path);
    },
  };
}
