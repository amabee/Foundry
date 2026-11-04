import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/lelmanga/index.js";
test("LelManga preserves source page size and French chapter numbering",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('?s=')?Array.from({length:20},(_,i)=>`<div class="bsx"><a href="/manga/book${i}/" title="Book ${i}"><img src="/cover.jpg"></a></div>`).join(''):url.includes('chapitre')?'<div id="readerarea"><img src="https://i0.wp.com/lelmanga.com/1.jpg"></div>':'<li data-num="2.5"><a href="/book0-chapitre-2-5/">Une histoire</a></li>'})}});
 const rows=await source.search('Book',{limit:1});assert.equal(rows.length,20);const c=await source.getChapters(rows[0].id);assert.equal(c[0].number,'2.5');assert.equal((await source.getPages(c[0].id)).length,1);
});
