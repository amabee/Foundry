import {test} from 'node:test';import assert from 'node:assert/strict';import {activate} from '../extensions/animeheaven/index.js';
test('AnimeHeaven sends only its public selector and ignores stale commented media',async()=>{
 const source=activate({host:{fetch:async r=>{assert.equal(r.headers['User-Agent'],'Mozilla/5.0');let body;
  if(r.url.includes('/search.php'))body='<div class="similarimg"><a href="anime.php?book"><img alt="Fixture"></a></div>';
  else if(r.url.includes('/anime.php'))body='<a id ="selector" href="gate.php"><div class="watch2">1.5</div></a>';
  else{assert.equal(r.headers.Cookie,'key=selector');assert.equal(r.headers.Referer,'https://animeheaven.me/anime.php?book');body='<!--<video id="vid"><source src="https://wrong.example/video.mp4"></video>--><video id="vid"><source src="https://ax.animeheaven.me/video.mp4?first&amp;second"></video>';}
  return{status:200,body};}}});
 assert.equal((await source.search('Fixture'))[0].id,'book');const eps=await source.getEpisodes('book');assert.equal(eps[0].number,1.5);const streams=await source.getStreams(eps[0].id);assert.equal(streams[0].videoSources[0].url,'https://ax.animeheaven.me/video.mp4?first&second');await assert.rejects(source.getStreams('book|selector;session=bad'),/identity/);
});
