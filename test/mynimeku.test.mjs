import{test}from'node:test';import assert from'node:assert/strict';import{activate}from'../extensions/mynimeku/index.js';
test('MyNimeKu refreshes the public nonce and separates real source mirrors',async()=>{
 const source=activate({host:{fetch:async r=>{let body;
  if(r.method==='POST'){assert(r.body.includes('nonce=fresh'));body=JSON.stringify({success:true,data:{items:[{type:'ANIME',url:'https://www.mynimeku.com/series/fixture/',title:'Fixture'},{type:'MANGA',url:'https://www.mynimeku.com/komik/wrong/',title:'Manga'}]}});}
  else if(r.url.endsWith('/series/fixture/'))body='<a class="komik-series-chapter-item" data-episode-number="1" href="/episode/fixture-1/">Episode 1</a>';
  else if(r.url.includes('/episode/'))body='<button class="mynimeku-episode-server-btn" data-player-host="CLOUD 720p" data-player-url="https://media.example/720.mp4"></button><button class="mynimeku-episode-server-btn" data-player-host="CLOUD 1080p" data-player-url="https://media.example/1080.mp4"></button><button class="mynimeku-episode-server-btn" data-player-host="DRIVE 720p" data-player-url="https://media.example/master.m3u8"></button>';
  else body='<form id="search-form" data-ajax-url="https://www.mynimeku.com/wp-admin/admin-ajax.php" data-nonce="fresh"></form>';return{status:200,body};}}});
 const titles=await source.search('Fixture');assert.equal(titles.length,1);const eps=await source.getEpisodes(titles[0].id),streams=await source.getStreams(eps[0].id);assert.equal(streams.length,2);assert.equal(streams[0].videoSources.length,2);assert.equal(streams[1].videoSources[0].type,'hls');
});
