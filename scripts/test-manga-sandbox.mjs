import {build} from "esbuild";
import {mkdir,mkdtemp,readFile,readdir,rm} from "node:fs/promises";
import {join} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {spawnSync} from "node:child_process";
const root=fileURLToPath(new URL('../',import.meta.url));
await mkdir(join(root,'.compat'),{recursive:true});
const scratch=await mkdtemp(join(root,'.compat/manga-sandbox-'));
try {
 const entries=(await readdir(join(root,'test'))).filter(name=>name.endsWith('.test.mjs'));
 // Bundle fixtures while replacing only the imported extension entry point.
 // The actual installed bundle is loaded by QuickJS from disk by the adapter.
 await build({absWorkingDir:root,entryPoints:entries.map(name=>'test/'+name),outdir:scratch,bundle:true,platform:'node',format:'esm',outExtension:{'.js':'.mjs'},packages:'external',plugins:[{name:'native-manga',setup(builder){
  builder.onResolve({filter:/manga-fixture-adapter\.mjs$/},args=>({path:args.path,external:true}));
  builder.onResolve({filter:/extensions\/[a-z0-9-]+\/index\.js$/},args=>({path:args.path.match(/extensions\/([a-z0-9-]+)\//)[1],namespace:'native-manga'}));
  builder.onLoad({filter:/.*/,namespace:'native-manga'},async args=>{const {role}=JSON.parse(await readFile(join(root,'extensions',args.path,'manifest.json'),'utf8'));return {contents:`import {nativeActivate} from ${JSON.stringify(pathToFileURL(join(root,'scripts/manga-fixture-adapter.mjs')).href)};export const activate=context=>nativeActivate(${JSON.stringify(args.path)},context,${JSON.stringify(role)});`,resolveDir:root};});
 }}]});
 const files=(await readdir(scratch)).filter(name=>name.endsWith('.mjs')).map(name=>join(scratch,name));
 if(!files.length)throw Error('No sandbox fixture tests were generated.');
 const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{cwd:root,stdio:'inherit',env:process.env});
 if(result.error)throw result.error;process.exitCode=result.status??1;
}finally{await rm(scratch,{recursive:true,force:true,maxRetries:10,retryDelay:100});}
