/** Bounded host-side media probe. Check every redirect and pin public DNS. */
export async function sampleMedia(sdk,input) {
 let current=new URL(input.url),headers={...input.headers};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try {
  for(let hop=0;hop<=5;hop++) {
   if(current.protocol!=='https:'||current.port&&current.port!=='443'||current.username||current.password)throw Error('Media requires public HTTPS.');
   await sdk.assertPublicHost(current.hostname);
   const response=await sdk.guardedFetch(current,{method:input.method??'GET',headers,redirect:'manual',dispatcher:sdk.publicDispatcher,signal:controller.signal});
   if([301,302,303,307,308].includes(response.status)){
    const location=response.headers.get('location');await response.body?.cancel();if(!location)throw Error('Media redirect has no destination.');
    const next=new URL(location,current);if(next.origin!==current.origin)headers=Object.fromEntries(Object.entries(headers).filter(([k])=>!['authorization','cookie'].includes(k.toLowerCase())));current=next;continue;
   }
   const max=input.maxBytes??256*1024;
   if(input.method==='HEAD'){await response.body?.cancel();return{status:response.status,headers:Object.fromEntries(response.headers),body:'',host:current.hostname};}
   if(Number(response.headers.get('content-length'))>max){await response.body?.cancel();throw Error('Media probe exceeds its byte limit.');}
   const reader=response.body?.getReader(),chunks=[];let size=0;
   try {if(reader)while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max)throw Error('Media probe exceeds its byte limit.');chunks.push(value);}}
   finally{await reader?.cancel();}
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
   return{status:response.status,headers:Object.fromEntries(response.headers),body:new TextDecoder().decode(bytes),host:current.hostname};
  }
  throw Error('Media exceeded its redirect limit.');
 }finally{clearTimeout(timer);controller.abort();}
}
