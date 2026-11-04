import {test} from 'node:test';import assert from 'node:assert/strict';import {activate} from '../extensions/animeunion/index.js';
test('AnimeUnion keeps stable title IDs and separates subtitle/dub qualities',async()=>{
 const source=activate({host:{fetch:async r=>{let data;
  if(r.url.includes('?q='))data={data:[{slug:'fixture',title:'Fixture',episodeCount:2}]};else if(r.url.includes('/api/v1/anime/'))data={data:{episodeCount:3}};
  else data={nodes:[{type:'data',data:[{episode:1},{streamLinks:2},[3,4],{url:5,language:6,quality:7},{url:8,language:9,quality:10},'https://media.example/sub.m3u8','SUB_ITA','Q_1080P','https://media.example/dub.mp4','DUB_ITA','Q_720P']}]};return{status:200,body:JSON.stringify(data)};}}});
 const title=(await source.search('Fixture'))[0];assert.equal(title.id,'fixture');const eps=await source.getEpisodes(title.id);assert.equal(eps.length,3);const streams=await source.getStreams(eps[0].id);assert.deepEqual(streams.map(s=>s.server),['Sub','Dub']);assert.equal(streams[0].videoSources[0].quality,'1080p');assert.equal((await source.getStreams(eps[0].id,{excludeServers:['Sub']}))[0].server,'Dub');
});
