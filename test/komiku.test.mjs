import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/komiku/index.js";
test("Komiku uses its separate API host and restricts source-owned chapter links",async()=>{
 const calls=[];const source=activate({host:{fetch:async({url})=>{calls.push(url);return{status:200,body:url.startsWith('https://api.')?'<div class="bge"><div class="bgei"><img src="https://img.komiku.org/cover.jpg"></div><div class="kan"><a href="https://komiku.org/manga/fixture/"><h3>Fixture</h3></a></div></div>':url.includes('-chapter-')?'<img class="klazy ww" src="https://img.komiku.org/1.jpg">':'<td class="judulseries"><a href="/fixture-chapter-2-5/"><span>Chapter 2.5</span></a></td>'};}}});
 const b=(await source.search('Fixture'))[0];const c=await source.getChapters(b.id);assert.equal(c[0].number,'2.5');assert.equal((await source.getPages(c[0].id)).length,1);assert(calls[0].startsWith('https://api.komiku.org/'));
});
