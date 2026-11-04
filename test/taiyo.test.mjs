import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/taiyo/index.js";
import {flightData,jsonArray} from "../lib/rsc-data.js";
test("Taiyo paginates search and chapters without dropping same-number editions",async()=>{
 const source=activate({host:{fetch:async r=>{let data;
  if(r.method==='POST'){const query=JSON.parse(r.body).queries[0];assert.equal(query.offset,24);assert(r.url.startsWith('https://meilisearch.taiyo.moe/'));data={results:[{hits:[{id:'book',titles:[{title:'Fixture',isMainTitle:true}]}],estimatedTotalHits:49}]};}
  else if(r.url.includes('/api/trpc/')){const page=JSON.parse(decodeURIComponent(r.url.split('input=')[1]))['0'].json.page;data=[{result:{data:{json:{totalPages:2,chapters:[{id:'c'+page,number:1,title:'Edition '+page}]}}}}];}
  else return{status:200,body:`<script>self.__next_f.push(${JSON.stringify([1,'0:{"pages":[{"id":"image","extension":"png"}],"nextChapter":null}'])})</script>`};
  return{status:200,body:JSON.stringify(data)};}}});
 assert.equal((await source.searchPage('Fixture',{page:2,limit:24})).hasMore,true);
 const chapters=await source.getChapters('book');assert.equal(chapters.length,2);assert.equal(chapters[1].id,'book|c2');
 assert.equal((await source.getPages(chapters[0].id))[0].url,'https://cdn.taiyo.moe/medias/book/chapters/c1/image.png');
 await assert.rejects(source.getPages('../book|c1'),/identity/);
});
test("serialized reader JSON handles quoted delimiters without executing scripts",()=>{
 const data='{"pages":[{"id":"a]b\\\"c"}],"other":[]}';
 assert.deepEqual(jsonArray(flightData(`self.__next_f.push(${JSON.stringify([1,data])})`),'pages'),[{id:'a]b"c'}]);
 assert.throws(()=>jsonArray('{"pages":[execute()]}','pages'),/Invalid/);
});
