import {after} from "node:test";
import {resolve} from "node:path";
import {openMangaRuntime} from "./manga-runtime.mjs";
const runtimes=new Set();
after(async()=>{for(const runtime of runtimes)await runtime.dispose();});
/** Replay the same fixture assertions against the real permission broker and QuickJS. */
export function nativeActivate(name,{host}) {
 let loading;
 const load=()=>loading??=openMangaRuntime(name,process.env.VESTRA_CHECKOUT??resolve('../Vestra'),async request=>({headers:{},url:request.url,statusText:'Fixture',...await host.fetch(request)})).then(runtime=>{runtimes.add(runtime);return runtime;});
 return Object.fromEntries(['search','searchPage','getChapters','getPages'].map(method=>[method,async(...args)=>{
  const runtime=await load(),value=await runtime.call(method,args);
  const schema=method==='searchPage'?runtime.sdk.mangaSearchPageSchema:method==='getChapters'?runtime.sdk.mangaChaptersSchema:method==='getPages'?runtime.sdk.mangaPagesSchema:runtime.sdk.mangaSearchResultsSchema;
  if(schema)schema.parse(value);return value;
 }]));
}
