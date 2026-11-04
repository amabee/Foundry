import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {openMangaRuntime} from "./manga-runtime.mjs";
if(!process.argv.includes("--live"))throw Error("This check contacts the source. Pass --live and an extension folder.");
const name=process.argv[process.argv.indexOf("--live")+1];
const vestra=process.env.VESTRA_CHECKOUT??resolve("../Vestra");
const query=process.argv.includes("--query")?process.argv[process.argv.indexOf("--query")+1]:"Naruto";
const runtime=await openMangaRuntime(name,vestra);
try {
  const search=runtime.sdk.mangaSearchPageSchema.parse(await runtime.call("searchPage",[query,{page:1,limit:24}]));assert(search.items.length);
  const second=runtime.sdk.mangaSearchPageSchema.parse(await runtime.call("searchPage",[query,{page:2,limit:24}]));
  const chapters=runtime.sdk.mangaChaptersSchema.parse(await runtime.call("getChapters",[search.items[0].id]));assert(chapters.length);
  const pages=runtime.sdk.mangaPagesSchema.parse(await runtime.call("getPages",[chapters[0].id]));assert(pages.length);
  const hosts=[...new Set(pages.map(page=>new URL(page.url).hostname))];assert(hosts.every(host=>runtime.manifest.hosts.includes(host)));
  let sampleStatus=null;
  if(process.argv.includes("--sample-image")) {
    const sample=await runtime.sdk.safeFetch({url:pages[0].url,method:"GET",body:null,headers:{...pages[0].headers,Range:"bytes=0-4095"},maxBytes:4*1024*1024,timeoutMs:15000});
    assert([200,206].includes(sample.status));
    const bytes=await runtime.sdk.safeFetchBytes({url:pages[0].url,headers:pages[0].headers,maxBytes:4*1024*1024,timeoutMs:15000});
    const hex=Buffer.from(bytes.slice(0,12)).toString("hex");assert(/^(?:ffd8ff|89504e470d0a1a0a|474946383[79]61|52494646[0-9a-f]{8}57454250)/.test(hex),"Expected actual JPEG, PNG, GIF or WebP image bytes");sampleStatus=sample.status;
  }
  const report={source:runtime.manifest.id,checkedAt:new Date().toISOString(),searchResults:search.items.length,secondPageResults:second.items.length,hasMore:search.hasMore,chapters:chapters.length,pages:pages.length,imageHosts:hosts,sampleStatus};
  await mkdir(".tools/live",{recursive:true});await writeFile(`.tools/live/${name}.json`,JSON.stringify(report,null,2));console.log("PASS "+JSON.stringify(report));
}finally{await runtime.dispose();}
