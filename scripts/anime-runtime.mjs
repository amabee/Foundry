import {build} from "esbuild";
import assert from "node:assert/strict";
import {mkdtemp,readFile,rm} from "node:fs/promises";
import {createRequire} from "node:module";
import {resolve,join} from "node:path";
import {fileURLToPath} from "node:url";
const root=fileURLToPath(new URL('../',import.meta.url));
export async function openAnimeRuntime(name,request) {
 if(!/^[a-z][a-z0-9-]+$/.test(name))throw Error('Invalid source directory');
 const vestra=resolve(process.env.VESTRA_CHECKOUT??'../Vestra'),hostRequire=createRequire(join(vestra,'packages/extension-host/package.json'));
 const scratch=await mkdtemp(join(vestra,'apps/nova/node_modules/.foundry-anime-'));let guest;
 const dispose=async()=>{guest?.dispose();await rm(scratch,{recursive:true,force:true,maxRetries:10,retryDelay:100});};
 try {
  await build({stdin:{contents:`export {createQuickJSRuntime} from './packages/extension-host/src/runtime/quickjs';export {createStreamSourceProvider} from './packages/extension-host/src/provider';export {createBrokeredFetch} from './packages/extension-host/src/net';export {parseManifest} from './packages/extension-host/src/manifest';export * from './packages/extension-host/src/stream-types';export {safeFetch,assertPublicHost} from './apps/nova/electron/safe-fetch';export {publicDispatcher} from './apps/nova/electron/public-network';export {fetch as guardedFetch} from ${JSON.stringify(createRequire(join(vestra,'apps/nova/package.json')).resolve('undici'))};`,resolveDir:vestra},bundle:true,platform:'node',format:'cjs',outfile:join(scratch,'runtime.cjs'),plugins:[{name:'quickjs',setup(b){b.onResolve({filter:/^quickjs-emscripten$/},()=>({path:hostRequire.resolve('quickjs-emscripten'),external:true}));}}]});
  const sdk=createRequire(import.meta.url)(join(scratch,'runtime.cjs'));
  const parsed=sdk.parseManifest(JSON.parse(await readFile(join(root,'extensions',name,'manifest.json'),'utf8')));assert.deepEqual(parsed.errors,[]);const manifest=parsed.manifest;
  const fetch=sdk.createBrokeredFetch({extensionId:manifest.id,granted:manifest.permissions,allowedHosts:manifest.hosts,grantedForVersion:manifest.version,grantedAt:new Date().toISOString()},{request:request??sdk.safeFetch});
  guest=await sdk.createQuickJSRuntime().load({extensionId:manifest.id,source:await readFile(join(root,'extensions',name,'index.js'),'utf8'),bridge:{extensionId:manifest.id,fetch,log(){}}});
  const methods=await guest.listMethods(AbortSignal.timeout(10000));for(const m of ['search','getEpisodes','getStreams'])assert(methods.includes(m));
  const warnings=[];
  const source=sdk.createStreamSourceProvider({extensionId:manifest.id,name:manifest.name,kinds:manifest.kinds,methods,call:(method,args,signal)=>guest.call(method,[...args],signal),onWarning:warning=>warnings.push(warning)});
  return{sdk,manifest,source,warnings,dispose,call:(method,args)=>guest.call(method,args,AbortSignal.timeout(15000))};
 }catch(error){await dispose();throw error;}
}
