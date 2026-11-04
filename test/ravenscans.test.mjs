import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/ravenscans/index.js";
test("RavenScans retains the source series prefix and excludes reader scripts and ads",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('?s=')?'<div class="bsx"><a href="/series/fixture/" title="Fixture"><img src="/cover.jpg"></a></div>':url.includes('chapter-')?'<img src="https://ads.example/ad.jpg"><div id="readerarea"><noscript><img src="https://ravenscans.org/1.jpg"></noscript></div>':'<li data-num="4.5"><a href="/fixture-chapter-4-5/">Chapter 4.5</a></li>'})}});
 const book=(await source.search('Fixture'))[0];assert.equal(book.id,'/series/fixture/');const chapter=(await source.getChapters(book.id))[0];assert.equal(chapter.number,'4.5');assert.equal((await source.getPages(chapter.id)).length,1);
});
