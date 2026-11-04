import {test} from "node:test";
import assert from "node:assert/strict";
import {activate} from "../extensions/mangakatana/index.js";
test("MangaKatana isolates search results, follows real pages and excludes unrelated chapter links",async()=>{
  const calls=[];const fixture={
    "https://mangakatana.com/?search=Fixture&search_by=m_name":'<a href="/manga/sidebar.99">Sidebar</a><div id="book_list"><div class="item"><a href="/manga/fixture.1"><img src="/cover.jpg" alt="[Cover]"></a><h3><a href="/manga/fixture.1">Fixture &amp; Test</a></h3></div></div><a rel="next" href="/page/2/?search=Fixture">Next</a>',
    "https://mangakatana.com/page/2/?search=Fixture&search_by=m_name":'<div id="book_list"><a href="/manga/second.2">Second</a></div>',
    "https://mangakatana.com/manga/fixture.1":'<a href="/manga/fixture.1/c2.5">Chapter 2.5</a><a href="/manga/fixture.1/c1">Chapter 1</a><a href="/manga/other.2/c1">Chapter 1</a>',
    "https://mangakatana.com/manga/fixture.1/c1":"<script>var thzq=['https://i1.mangakatana.com/a.jpg','https://i1.mangakatana.com/b.jpg',];</script>",
  };
  const source=activate({host:{fetch:async({url})=>{calls.push(url);assert(url in fixture);return{status:200,body:fixture[url]};}}});
  const page=await source.searchPage("Fixture",{page:1});assert.equal(page.items.length,1);assert.equal(page.items[0].title,"Fixture & Test");assert(page.items[0].cover);assert.equal(page.hasMore,true);
  assert.equal((await source.searchPage("Fixture",{page:2})).hasMore,false);
  const chapters=await source.getChapters(page.items[0].id);assert.deepEqual(chapters.map(row=>row.number),["1","2.5"]);
  const pages=await source.getPages(chapters[0].id);assert.equal(pages.length,2);assert.equal(pages[0].headers.Referer,"https://mangakatana.com/");
  await assert.rejects(source.getPages("https://evil.example/manga/fixture.1/c1"),/identity/);assert.equal(calls.length,4);
});
test("remote page expressions are never evaluated and unknown image hosts stay blocked",async()=>{
  for(const body of ["var thzq=[doSomething()];","var thzq=['https://evil.example/page.jpg'];"]){const source=activate({host:{fetch:async()=>({status:200,body})}});await assert.rejects(source.getPages("/manga/fixture.1/c1"),/invalid page metadata|unapproved image host/);}
});
