import {test} from "node:test";
import assert from "node:assert/strict";
import {activate} from "../extensions/mangabuddy/index.js";
function fixture() {
  const calls=[];
  const source=activate({host:{fetch:async request=>{
    calls.push(request);
    if(request.url.includes("/titles/search")) {const page=Number(new URL(request.url).searchParams.get("page"));return {status:200,body:JSON.stringify({success:true,data:{items:[{id:"stable",name:"Fixture",cv:Date.now(),cover:"https://rx.resmk.org/cover.webp"}],pagination:{page,has_next:page===1}}})};}
    if(request.url==="https://api.mangak.io/titles/stable/chapters")return {status:200,body:JSON.stringify({success:true,data:{chapters:[{url:"/fixture/chapter-12-5",name:"Vol.2 Chapter 12.5"},{url:"/fixture/chapter-1",name:"Chapter 1"},{url:"/fixture/special",name:"Bonus"}]}})};
    if(request.url==="https://mangak.io/fixture/chapter-1")return {status:200,body:'<script id="__NEXT_DATA__" type="application/json">'+JSON.stringify({props:{pageProps:{initialChapter:{images:["https://rx.qvzra.org/page.webp","https://rx.qvzrk.org/page.jpg"]}}}})+'</script>'};
    throw Error("Unexpected request");
  }}});
  return {source,calls};
}
test("MangaBuddy uses real paged search and stable IDs without cache-version timestamps",async()=>{
  const f=fixture();const first=await f.source.searchPage("Fixture",{page:1,limit:24});const second=await f.source.searchPage("Fixture",{page:2,limit:24});
  assert.equal(first.hasMore,true);assert.equal(second.hasMore,false);assert.equal(first.items[0].id,second.items[0].id);
  assert.equal(first.items[0].cover.headers.Referer,"https://mangak.io/");
  const chapters=await f.source.getChapters(first.items[0].id);assert.deepEqual(chapters.map(row=>row.number),["1","12.5","Special"]);
  const pages=await f.source.getPages(chapters[0].id);assert.equal(pages.length,2);assert.equal(pages[0].index,0);assert.equal(pages[1].headers.Referer,"https://mangak.io/");
  assert.equal(f.calls.length,4);
});
test("invalid IDs and pagination are rejected before making network requests",async()=>{
  const f=fixture();
  await assert.rejects(f.source.searchPage("Fixture",{page:0}),/pagination/);
  await assert.rejects(f.source.getChapters("../secret"),/identity/);
  await assert.rejects(f.source.getPages("https://untrusted.example/fixture/chapter-1"),/identity/);
  await assert.rejects(f.source.getPages("/fixture/../secret"),/identity/);
  assert.equal(f.calls.length,0);
});
test("blocked requests and malformed responses are errors instead of false empty search results",async()=>{
  for(const reply of [{status:403,body:"denied"},{status:200,body:"not-json"},{status:200,body:JSON.stringify({success:true,data:{items:[]}})}]) {
    const source=activate({host:{fetch:async()=>reply}});
    await assert.rejects(source.searchPage("Fixture"),/HTTP 403|invalid JSON|pagination/);
  }
  const source=activate({host:{fetch:async()=>({status:200,body:'<script id="__NEXT_DATA__">{"props":{"pageProps":{"initialChapter":{"images":["https://evil.example/page.jpg"]}}}}</script>'})}});
  await assert.rejects(source.getPages("/fixture/chapter-1"),/unapproved image host/);
});
