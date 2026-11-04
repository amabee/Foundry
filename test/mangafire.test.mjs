import {test} from "node:test";import assert from "node:assert/strict";import {activate} from "../extensions/mangafire/index.js";import {signedPath} from "../extensions/mangafire/src/request-key.js";
test("MangaFire matches upstream request-signing vectors including arrays and UTF-8",()=>{
 assert.equal(signedPath('/api/titles',[['keyword','Naruto'],['content_rating[]','safe'],['content_rating[]','suggestive'],['page','2'],['limit','24']]),'/api/titles?content_rating%5B%5D=safe&content_rating%5B%5D=suggestive&keyword=Naruto&limit=24&page=2&vrf=8sK3xtqdFZdOu6WNqS1bZ0shnUDqyRXMnh4NlZ7aYCPUhmAbm1C1qPzeL_OIIf0obIggCZIHJHIF_VdagQOsZhrpZQ2oNB_1bK4a7Gey_NoSeuni8E2s-f8y');
 assert.equal(signedPath('/api/titles',[['keyword','日本 & !'],['order[relevance]','desc']]),'/api/titles?keyword=%E6%97%A5%E6%9C%AC+%26+%21&order%5Brelevance%5D=desc&vrf=8sK3xtqdFZfetBhus6bRAtPZVQInvG-lKyTvI_zWAWvt2wYrqSaAhceu25b5PsWh');
 assert.equal(signedPath('/api/chapters/123'),'/api/chapters/123?vrf=8vPRXa1JjvVTxq_RmQ');
});
test("MangaFire loads every page and translation with stable distinct chapter IDs",async()=>{
 const source=activate({host:{fetch:async r=>{const u=new URL(r.url);assert(u.searchParams.has('vrf'));let d;
  if(u.pathname==='/api/titles')d={items:[{hid:'book',title:'Fixture'}],meta:{lastPage:3}};
  else if(u.pathname==='/api/titles/book')d={data:{languages:['en','fr']}};
  else if(u.pathname.endsWith('/chapters')){const lang=u.searchParams.get('language'),page=u.searchParams.get('page');d={items:[{id:lang+page,number:1,name:'',type:'group'}],meta:{lastPage:2}};}
  else d={data:{pages:[{url:'https://k99.mfcdn1.xyz/page.jpg'}]}};return{status:200,body:JSON.stringify(d)};}}});
 assert.equal((await source.searchPage('Fixture',{page:2})).hasMore,true);const cs=await source.getChapters('book');assert.equal(cs.length,4);assert.equal(cs[3].language,'fr');assert.equal(cs[3].index,3);assert.equal((await source.getPages('en1')).length,1);
});

test("MangaFire accepts the reviewed Latna CDN hosts and still refuses unrelated destinations",async()=>{let page='https://l1n.mfcdn2.xyz/0.jpg';const source=activate({host:{fetch:async()=>({status:200,body:JSON.stringify({data:{pages:[{url:page}]}})})}});for(const host of ['l1n.mfcdn2.xyz','q73.mfcdn1.xyz','l1n.mfcdn3.xyz']){page='https://'+host+'/page.jpg';assert.equal((await source.getPages('123'))[0].url,page);}page='https://unreviewed.example/page.jpg';await assert.rejects(()=>source.getPages('123'),/unapproved image host/);});
