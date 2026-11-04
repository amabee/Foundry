import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mangaball/index.js";
test("MangaBall uses the current API, real pagination and distinct language editions",async()=>{
 const source=activate({host:{fetch:async r=>{assert(r.url.startsWith('https://mangaball.com/'));let data;
  if(r.url.endsWith('/title/search')){const body=JSON.parse(r.body);assert.equal(body.keyword,'Fixture');assert.equal(body.page,2);data={status:'success',data:[{_id:'book',name:'Fixture'}],pagination:{page:2,total_pages:3}};}
  else if(r.url.includes('listing'))data={status:'success',data:[{id:'en',title_id:'book',number:1,lang:'en',group_name:'A'},{id:'fr',title_id:'book',number:1,lang:'fr',group_name:'B'}]};
  else data={status:'success',data:{chapter:{pages:['https://bulbasaur.poke-black-and-white.net/page.webp']}}};return{status:200,body:JSON.stringify(data)};}}});
 assert.equal((await source.searchPage('Fixture',{page:2})).hasMore,true);const cs=await source.getChapters('book');assert.equal(cs.length,2);assert.equal(cs[1].language,'fr');assert.equal(cs[1].index,1);assert.equal((await source.getPages('en')).length,1);
});
