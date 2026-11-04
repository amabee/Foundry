import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/fanfox/index.js";
test("FanFox native HTML adapter reads only source result/chapter/reader regions",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('/search?')?'<div class="post-one clearfix"><a href="/manga/fixture/"><img src="https://fmcdn.mfcdn.net/cover.jpg"></a><p class="title">Fixture</p></div>':url.endsWith('/1.html')?'<img class="reader-page" data-original="https://fmcdn.mfcdn.net/1.jpg"><img src="https://ads.example/ad.jpg">':'<dd class="chlist"><a href="//m.fanfox.net/manga/fixture/v1/c1/1.html">Ch 1</a><a href="/manga/other/v1/c2/1.html">Ch 2</a></dd>'})}});
 const found=await source.search('Fixture');assert.equal(found.length,1);const chapters=await source.getChapters(found[0].id);assert.equal(chapters.length,1);assert.equal(chapters[0].number,'1');assert.equal((await source.getPages(chapters[0].id)).length,1);
});
