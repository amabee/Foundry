import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mynimekumanga/index.js";
test("MyNimeKu reads a fresh public search nonce and preserves source chapter numbers",async()=>{
 const source=activate({host:{fetch:async request=>({status:200,body:request.url.endsWith('/')?'var mynimekuConfig={"nonce":"fresh123"};':request.method==='POST'?(assert(request.body.includes('nonce=fresh123')),JSON.stringify({success:true,data:{items:[{type:'MANGA',url:'https://www.mynimeku.com/komik/fixture',title:'Fixture'}]}})):request.url.includes('/komik/')?'<div data-chapter-number="1.5"><a class="komik-series-chapter-item" href="/fixture-chapter-1-5">Chapter 1.5</a></div>':'<div class="komik-reader-content"><img src="//image.mydriveku.my.id/api/view-image/fixture"></div>'})}});
 const b=(await source.search('Fixture'))[0],c=(await source.getChapters(b.id))[0];assert.equal(c.number,'1.5');assert.equal((await source.getPages(c.id)).length,1);
});
