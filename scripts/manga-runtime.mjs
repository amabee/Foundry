import {build} from "esbuild";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL("../",import.meta.url));
/** Real Vestra QuickJS, schemas, permission broker and DNS-guarded network. */
export async function openMangaRuntime(name,vestraRoot,request) {
  if(!/^[a-z][a-z0-9-]+$/.test(name))throw Error("Invalid extension name");
  const vestra=resolve(vestraRoot),hostRequire=createRequire(join(vestra,"packages/extension-host/package.json"));
  const scratch=await mkdtemp(join(vestra,"apps/nova/node_modules/.foundry-manga-"));let guest;
  const dispose=async()=>{guest?.dispose();await rm(scratch,{recursive:true,force:true,maxRetries:10,retryDelay:100});};
  try{
    await build({stdin:{contents:`export {createQuickJSRuntime} from './packages/extension-host/src/runtime/quickjs';export {createBrokeredFetch} from './packages/extension-host/src/net';export {parseManifest} from './packages/extension-host/src/manifest';export * from './packages/extension-host/src/manga-types';export {safeFetch,safeFetchBytes} from './apps/nova/electron/safe-fetch';`,resolveDir:vestra},bundle:true,platform:"node",format:"cjs",outfile:join(scratch,"runtime.cjs"),plugins:[{name:"quickjs",setup(build){build.onResolve({filter:/^quickjs-emscripten$/},()=>({path:hostRequire.resolve("quickjs-emscripten"),external:true}));}}]});
    const sdk=createRequire(import.meta.url)(join(scratch,"runtime.cjs"));
    const parsed=sdk.parseManifest(JSON.parse(await readFile(join(root,"extensions",name,"manifest.json"),"utf8")));assert.deepEqual(parsed.errors,[]);const manifest=parsed.manifest;
    const fetch=sdk.createBrokeredFetch({extensionId:manifest.id,granted:manifest.permissions,allowedHosts:manifest.hosts,grantedForVersion:manifest.version,grantedAt:new Date().toISOString()},{request:request??sdk.safeFetch});
    guest=await sdk.createQuickJSRuntime().load({extensionId:manifest.id,source:await readFile(join(root,"extensions",name,"index.js"),"utf8"),bridge:{extensionId:manifest.id,fetch,log(){}}});
    const methods=await guest.listMethods(AbortSignal.timeout(10000));for(const method of ["search","searchPage","getChapters","getPages"])assert(methods.includes(method));
    return {manifest,sdk,dispose,call:(method,args)=>guest.call(method,args,AbortSignal.timeout(20000))};
  }catch(error){await dispose();throw error;}
}
