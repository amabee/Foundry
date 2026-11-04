import{test}from'node:test';import assert from'node:assert/strict';import{url}from'../lib/manga-common.js';import{mediaUrl}from'../lib/anime-common.js';
test('source URLs accept valid repeated-hyphen CDN labels and reject malformed labels',()=>{
 assert.equal(url('https://rr2---sn-2aqu-jbtz.googlevideo.com/videoplayback','https://source.example').host,'rr2---sn-2aqu-jbtz.googlevideo.com');
 for(const host of ['-cdn.example','cdn-.example','cdn..example','x'.repeat(64)+'.example'])assert.equal(url('https://'+host+'/video','https://source.example'),null);
 for(const value of ['https://user:pass@media.example/video.mp4','https://127.0.0.1/video.mp4','https://media.local/video.mp4','https://media.example/../private'])assert.throws(()=>mediaUrl(value,'https://source.example'),/Invalid/);
});
