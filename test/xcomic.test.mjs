import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/xcomic/index.js";
test("xComic selects the largest English edition and reads Qwik data without unrelated images",async()=>{
 const visited=[];const source=activate({host:{fetch:async r=>{visited.push(r.url);let body;
  if(r.url.includes('/search?'))body='<img src="https://cdn.mangabaka.dev/cover.jpg"><a href="/title/book">Fixture</a><a href="/search?word=Fixture&amp;page=2">Next</a>';
  else if(r.url.includes('/title/'))body='🇬🇧<a href="/source/small">Fixture</a>2 chapters 🇫🇷<a href="/source/french">Fixture</a>200 chapters 🇬🇧<a href="/source/large">Fixture</a>50 chapters';
  else if(r.url.includes('/source/'))body='<a href="/chapter/c2">Chapter 2</a><a href="/chapter/c1">Chapter 1</a>';
  else body='<img src="https://unrelated.example/logo.png"><script type="qwik/state">[0,"imageUrls",4,[0,"https://i08.img00.org/page.webp"]]</script>';
  return{status:200,body};}}});
 assert.equal((await source.searchPage('Fixture')).hasMore,true);const chapters=await source.getChapters('book');assert(visited.some(u=>u.endsWith('/source/large')));assert.equal(chapters[0].id,'c1');assert.equal((await source.getPages('c1')).length,1);
});
test("xComic discovers additional result pages when the site renders no Next link",async()=>{
 const calls=[];const source=activate({host:{fetch:async r=>{const page=Number(new URL(r.url).searchParams.get('page'));calls.push(page);return{status:200,body:page<3?`<a href="/title/book${page}">Fixture ${page}</a>`:''};}}});
 const first=await source.searchPage('Fixture'),second=await source.searchPage('Fixture',{page:2});
 assert.equal(first.hasMore,true);assert.equal(second.hasMore,false);assert.equal(second.items[0].id,'book2');assert.deepEqual(calls,[1,2,3]);
});
