import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mangadot/index.js";
test("MangaDot retains translations and sorts numeric image keys",async()=>{
 const source=activate({host:{fetch:async r=>{assert(r.url.startsWith('https://mangadot.net/'));const data=r.url.includes('/search?')?{manga_list:[{id:1,title:'Fixture'}],has_more:true}:r.url.includes('/chapters/list')?[{id:1,chapter_number:1,language:'en',group_name:'A'},{id:2,chapter_number:1,language:'fr',group_name:'B'}]:{images:{'10':{url:'/10.jpg'},'2':{url:'/2.jpg'}}};return{status:200,body:JSON.stringify(data)};}}});
 assert.equal((await source.searchPage('Fixture',{page:2})).hasMore,true);assert.equal((await source.getChapters('1')).length,2);assert.equal((await source.getPages('1'))[0].url,'https://mangadot.net/2.jpg');
});
test("MangaDot reports access denial once without solver or recursive retries",async()=>{
 let calls=0;const source=activate({host:{fetch:async()=>{calls++;return{status:403,body:'Verification required'};}}});await assert.rejects(source.search('Fixture'),/403/);assert.equal(calls,1);
});
