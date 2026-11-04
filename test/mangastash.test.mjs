import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mangastash/index.js";
test("MangaStash keeps source identities, chapter membership and explicit reader page order",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('/search?')?'<a class="search-result-row" href="/manga/fixture"><img src="/cover.jpg"><h3>Fixture</h3></a>':url.includes('/chapter-')?'<div class="reader-page" data-page="2"><img data-src="/2.jpg"></div><div class="reader-page" data-page="1"><img src="/1.jpg"></div>':'<a class="chapter-row" data-num="2.5" href="/manga/fixture/chapter-2-5">Ch 2.5</a><a class="chapter-row" data-num="1" href="/manga/other/chapter-1">Ch 1</a>'})}});
 const book=(await source.search('Fixture'))[0];const c=await source.getChapters(book.id);assert.equal(c.length,1);assert.equal(c[0].number,'2.5');const p=await source.getPages(c[0].id);assert.equal(p[0].url,'https://mangastash.org/1.jpg');
});
