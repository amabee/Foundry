import{test}from'node:test';import assert from'node:assert/strict';import{activate}from'../extensions/anitube/index.js';import{unpackData}from'../lib/packed-data.js';
test('AniTube parses Portuguese episodes and direct player media',async()=>{
 const source=activate({host:{fetch:async r=>({status:200,body:r.url.includes('?s=')?'<div class="aniItem"><a href="/anime/fixture/" title="Fixture Dublado">Fixture</a></div>':r.url.endsWith('/anime/fixture/')?'<div class="pagAniListaContainer"><a href="/fixture-episodio-2/">Episódio 2</a><a href="/fixture-episodio-1/">Episódio 1</a></div>':r.url.includes('api.anivideo.net')?"player.setup({file:'https://media.example/master.m3u8'});":'<div id="blog2"><iframe src="https://api.anivideo.net/player/fixture"></iframe></div>'})}});const title=(await source.search('Fixture'))[0],eps=await source.getEpisodes(title.id);assert.equal(eps[0].number,1);assert.equal((await source.getStreams(eps[0].id))[0].videoSources[0].type,'hls');
});
test('packed player data is substituted without executing its function',()=>{
 const code="eval(function(p,a,c,k,e,d){throw Error('must never execute');}('0({1:\"2\"})',3,3,'player|file|https://media.example/video.mp4'.split('|'),0,{}))";
 assert.equal(unpackData(code),'player({file:"https://media.example/video.mp4"})');
});
test('Blogger public MP4 data retains all qualities without executing its configuration',async()=>{
 const {extractPlayer}=await import('../lib/anime-embed.js');
 const data='streamingData":'+JSON.stringify({formats:[{url:'https://rr2---sn-2aqu-jbtz.googlevideo.com/videoplayback?mime=video%2Fmp4',mimeType:'video/mp4; codecs="avc1"',qualityLabel:'360p'}]});
 const html='<div data-player="'+JSON.stringify(data).replace(/"/g,'&quot;')+'"></div>';
 const result=await extractPlayer('https://www.blogger.com/video.g?token=fixture',async()=>html,{origin:'https://www.anitube.zip',hosts:['www.blogger.com'],server:'Blog'});
 assert.equal(result.videoSources.length,1);assert.equal(result.videoSources[0].quality,'360p');
});
