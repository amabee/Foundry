import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/asurascans/index.js";
const island=(name,data)=>`<astro-island component-url="/${name}.js" props="${JSON.stringify(data).replace(/&/g,'&amp;').replace(/"/g,'&quot;')}"></astro-island>`;
test("AsuraScans parses typed Astro metadata and restricts chapters to the selected comic",async()=>{
 const source=activate({host:{fetch:async({url})=>({status:200,body:url.includes('/browse?')?island('BrowseFilters',{initialSeries:[1,[[0,{public_url:[0,'/comics/fixture'],title:[0,'Fixture'],cover:[0,'https://cdn.asurascans.com/cover.jpg']}]]]}):url.endsWith('/chapter/1')?island('ChapterReader',{pages:[1,[[0,{url:[0,'https://cdn.asurascans.com/1.webp']}]]]}):'<a href="/comics/fixture/chapter/1">Chapter 1</a><a href="/comics/other/chapter/2">Chapter 2</a>'})}});
 const titles=await source.search('Fixture');assert.equal(titles.length,1);const chapters=await source.getChapters(titles[0].id);assert.equal(chapters.length,1);assert.equal((await source.getPages(chapters[0].id))[0].headers.Referer,'https://asurascans.com/comics/fixture/chapter/1');
});
