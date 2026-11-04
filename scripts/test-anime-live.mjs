import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {openAnimeRuntime} from "./anime-runtime.mjs";
import {sampleMedia} from "./guarded-media.mjs";
if(!process.argv.includes('--live'))throw Error('Pass --live <source> to contact a source.');
const name=process.argv[process.argv.indexOf('--live')+1],query=process.argv.includes('--query')?process.argv[process.argv.indexOf('--query')+1]:'Naruto';
const runtime=await openAnimeRuntime(name),context=()=>({signal:AbortSignal.timeout(15000),timeoutMs:15000});
try {
 const titles=await runtime.source.search(query,{limit:50},context());assert(titles.length,'Expected search results');
 const title=titles.find(t=>t.title.toLowerCase()===query.toLowerCase())??titles[0];
 const episodes=await runtime.source.getEpisodes(title.id,context());assert(episodes.length,'Expected episodes');
 const wanted=process.argv.includes('--episode')?Number(process.argv[process.argv.indexOf('--episode')+1]):1;const episode=episodes.find(e=>e.number===wanted)??episodes[0],streams=await runtime.source.getStreams(episode.id,context());assert(streams.length,'Expected streams');assert.deepEqual(runtime.warnings,[]);
 let sampleStatus=null,sampleScope='metadata only';
 if(process.argv.includes('--sample-media')||process.argv.includes('--media-headers')){
  const stream=streams[0],video=stream.videoSources[0],headers={...stream.headers,...video.headers};
  const onlyHeaders=process.argv.includes('--media-headers');
  const sample=await sampleMedia(runtime.sdk,{url:video.url,method:onlyHeaders?'HEAD':'GET',headers:onlyHeaders?headers:{...headers,Range:'bytes=0-4095'},maxBytes:256*1024});
  assert([200,206].includes(sample.status),`Media HTTP ${sample.status}`);
  if(!onlyHeaders){if(video.type==='hls')assert(sample.body.trimStart().startsWith('#EXTM3U'),'Expected an HLS playlist');else if(video.type==='mp4')assert(sample.body.slice(0,40).includes('ftyp'),'Expected an MP4 signature');else assert(sample.body.charCodeAt(0)===0x1a,'Expected a Matroska signature');}
  sampleStatus=sample.status;sampleScope=onlyHeaders?'headers only':'bounded media signature';
 }
 const report={source:runtime.manifest.id,checkedAt:new Date().toISOString(),searchResults:titles.length,episodes:episodes.length,servers:streams.map(s=>s.server),renditions:streams.reduce((n,s)=>n+s.videoSources.length,0),mediaHosts:[...new Set(streams.flatMap(s=>s.videoSources.map(v=>new URL(v.url).hostname)))],sampleStatus,sampleScope};
 await mkdir('.tools/live-anime',{recursive:true});await writeFile(`.tools/live-anime/${name}.json`,JSON.stringify(report,null,2));console.log('PASS '+JSON.stringify(report));
}finally{await runtime.dispose();}
