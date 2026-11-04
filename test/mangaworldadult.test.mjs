import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mangaworldadult/index.js";
test("MangaWorldAdult native parsing handles Italian chapter labels and list reader layout",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('/archive?')?'<div class="entry"><a class="manga-title" href="/manga/fixture" title="Fixture"><img src="/cover.jpg"></a></div>':url.includes('/read/')?(assert(url.endsWith('?style=list')),'<div id="page"><img src="/fixture.jpg"></div>'):'<div class="chapters-wrapper"><div class="volume-element"><a class="chap" href="/manga/fixture/read/one?style=list">Capitolo 2.5</a></div></div>'})}});
 const b=(await source.search('Fixture'))[0],c=(await source.getChapters(b.id))[0];assert.equal(c.number,'2.5');const p=await source.getPages(c.id);assert.equal(p[0].headers.Referer,'https://www.mangaworldadult.net/manga/fixture');
});
