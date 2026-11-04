import {after} from "node:test";
import {resolve} from "node:path";
import {openMangaRuntime} from "./manga-runtime.mjs";
import {openAnimeRuntime} from "./anime-runtime.mjs";
const runtimes=new Set();
after(async()=>{for(const runtime of runtimes)await runtime.dispose();});
/** Replay the same fixture assertions against the real permission broker and QuickJS. */
export function nativeActivate(name,{host},role="manga-source") {
 let loading;
 const request=async request=>({headers:{},url:request.url,statusText:'Fixture',...await host.fetch(request)});
 const load=()=>loading??=(role==='stream-source'?openAnimeRuntime(name,request):openMangaRuntime(name,process.env.VESTRA_CHECKOUT??resolve('../Vestra'),request)).then(runtime=>{runtimes.add(runtime);return runtime;});
 const methods=role==='stream-source'?['search','getEpisodes','getStreams']:['search','searchPage','getChapters','getPages'];
 return Object.fromEntries(methods.map(method=>[method,async(...args)=>{
  const runtime=await load(),value=await runtime.call(method,args);
  if(role==='stream-source'){
   const schema=method==='search'?runtime.sdk.animeSchema:method==='getEpisodes'?runtime.sdk.episodeSchema:runtime.sdk.streamResultSchema;
   for(const row of value)schema.parse(method==='search'?{...row,provider:runtime.manifest.id}:row);return value;
  }
  const schema=method==='searchPage'?runtime.sdk.mangaSearchPageSchema:method==='getChapters'?runtime.sdk.mangaChaptersSchema:method==='getPages'?runtime.sdk.mangaPagesSchema:runtime.sdk.mangaSearchResultsSchema;
  if(schema)schema.parse(value);return value;
 }]));
}
