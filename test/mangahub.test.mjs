import {test} from "node:test";
import assert from "node:assert/strict";
import {activate} from "../extensions/mangahub/index.js";
test("MangaHub preserves Russian chapter numbers, nested search cards and reader-only image order",async()=>{
  const files={
    "https://mangahub.ru/search?query=Fixture":'<div class="item-slide position-relative"><div><img class="item-slide-image" src="//p1.statichub.org/cover.png"><a class="fw-medium" href="/title/fixture">Fixture</a></div></div><a rel="next" href="/search?query=Fixture&amp;page=2">Next</a>',
    "https://mangahub.ru/title/fixture/chapters":'<a class="fs-2 fw-medium" href="/read/3"><span>Том 3. Глава 12.5 — Test</span></a><a class="fs-2 fw-medium" href="/read/1">Глава 1</a><a href="/read/999">Other</a>',
    "https://mangahub.ru/read/1":'<img src="https://ads.example/track.gif"><reader-scan><div><img src="//p1.statichub.org/1.png"></div></reader-scan><reader-scan><img src="placeholder.gif" data-src="https://p1.statichub.org/2.webp"></reader-scan>',
  };
  const calls=[];const source=activate({host:{fetch:async({url})=>{calls.push(url);assert(url in files);return{status:200,body:files[url]};}}});
  const page=await source.searchPage("Fixture",{limit:1});assert.equal(page.hasMore,true);assert.equal(page.items[0].cover.url,"https://p1.statichub.org/cover.png");
  const chapters=await source.getChapters(page.items[0].id);assert.deepEqual(chapters.map(row=>row.number),["1","12.5"]);assert.equal(chapters[0].language,"ru");
  const pages=await source.getPages(chapters[0].id);assert.equal(pages.length,2);assert.equal(pages[0].headers.Referer,"https://mangahub.ru/read/1");assert.equal(calls.length,3);
  await assert.rejects(source.getPages("https://evil.example/read/1"),/identity/);
});
