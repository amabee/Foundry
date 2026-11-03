import {test} from "node:test";import assert from "node:assert/strict";
import {activate as h2r} from "../extensions/hentai2read/index.js";import {activate as era} from "../extensions/hentaiera/index.js";
function fixture(activate,files){const calls=[];return {calls,source:activate({host:{async fetch(request){calls.push(request);const body=files[request.url];assert.ok(body!==undefined,"Unexpected metadata request: "+request.url);return typeof body==='object'?body:{status:200,body};}}})};}
test("Hentai2Read pages search, chapters and reader metadata through the native API",async()=>{
 const f=fixture(h2r,{'https://hentai2read.com/hentai-search/?search=Fixture&page=1':'<a href="/fixture/"><img src="https://hentaicdn.com/hentai/cover.jpg" alt="Fixture"></a><a rel="next" href="?search=Fixture&page=2">Next</a>','https://hentai2read.com/hentai-search/?search=Fixture&page=2':'<a title="Second Fixture" href="/second/"></a>','https://hentai2read.com/fixture/':'<a href="/fixture/2/">Two</a><a href="/fixture/1/">One</a><a href="https://other.example/fixture/3/">Wrong site</a>','https://hentai2read.com/fixture/1/':'<script>var reader={"images":["chapter/1.jpg","/hentai/chapter/2.png"]};</script>'});
 const first=await f.source.searchPage('Fixture',{page:1});assert.equal(first.items[0].title,'Fixture');assert.equal(first.hasMore,true);assert.equal((await f.source.searchPage('Fixture',{page:2})).hasMore,false);
 const chapters=await f.source.getChapters(first.items[0].id);assert.deepEqual(chapters.map(c=>c.number),['1','2']);const pages=await f.source.getPages(chapters[0].id);assert.deepEqual(pages.map(p=>p.url),['https://hentaicdn.com/hentai/chapter/1.jpg','https://hentaicdn.com/hentai/chapter/2.png']);
 assert.ok(f.calls.every(call=>!call.url.includes('hentaicdn.com')));await assert.rejects(f.source.getChapters('https://untrusted.example/fixture/'),/Invalid/);
});
test("HentaiEra uses the public key/page search and per-page reader format metadata",async()=>{
 const f=fixture(era,{'https://hentaiera.com/search/?key=Fixture&page=1':'<a href="/gallery/123/"><img data-src="https://m11.hentaiera.com/path/thumb.jpg"></a><h2><a href="/gallery/123/">Fixture &amp; Test</a></h2><a href="/search/?key=Fixture&amp;page=2">Next</a>','https://hentaiera.com/search/?key=Fixture&page=2':'No results','https://hentaiera.com/gallery/123/':'<a href="/view/123/1/">Read</a>','https://hentaiera.com/view/123/1/':`<img data-src="https://m11.hentaiera.com/path/1.webp"><script>var g_th = $.parseJSON('{"1":"w,100,200","2":"j,100,200"}');</script>`});
 const page=await f.source.searchPage('Fixture',{page:1});assert.equal(page.items.length,1);assert.equal(page.items[0].title,'Fixture & Test');assert.ok(page.items[0].cover);assert.equal(page.hasMore,true);assert.equal((await f.source.searchPage('Fixture',{page:2})).items.length,0);
 const [chapter]=await f.source.getChapters(page.items[0].id);const pages=await f.source.getPages(chapter.id);assert.deepEqual(pages.map(p=>p.url),['https://m11.hentaiera.com/path/1.webp','https://m11.hentaiera.com/path/2.jpg']);assert.equal(pages[0].headers.Referer,chapter.id);assert.equal(f.calls.length,4);
});
test("HTTP failures and verification pages stay explicit; unknown image hosts are rejected",async()=>{
 const denied=fixture(h2r,{'https://hentai2read.com/hentai-search/?search=Fixture&page=1':{status:403,body:'Forbidden'}});await assert.rejects(denied.source.searchPage('Fixture',{}),/HTTP 403/);
 const challenge=fixture(era,{'https://hentaiera.com/search/?key=Fixture&page=1':'<title>Just a moment</title>'});await assert.rejects(challenge.source.searchPage('Fixture',{}),/browser verification/);
 await assert.rejects(denied.source.searchPage('Fixture',{page:0}),/Invalid search page/);
});
