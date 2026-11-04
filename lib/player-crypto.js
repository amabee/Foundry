import {cbc,gcm} from '@noble/ciphers/aes.js';
import {decodeBase64Bytes} from './base64.js';
export function utf8(value){return Uint8Array.from(encodeURIComponent(value).match(/%[0-9a-f]{2}|[^%]/gi)??[],c=>c[0]==='%'?parseInt(c.slice(1),16):c.charCodeAt(0));}
export function plaintext(bytes){try{return decodeURIComponent([...bytes].map(b=>'%'+b.toString(16).padStart(2,'0')).join(''));}catch{throw Error('Player returned invalid UTF-8 data.');}}
export function hex(value){if(typeof value!=='string'||value.length>262144||value.length%2||!/^[0-9a-f]*$/i.test(value))throw Error('Invalid player ciphertext.');return Uint8Array.from(value.match(/../g)??[],v=>parseInt(v,16));}
export function decryptCbcHex(value,key,iv){return plaintext(cbc(utf8(key),utf8(iv)).decrypt(hex(value)));}
export function decryptByse(playback){
 const parts=playback?.key_parts;if(!Array.isArray(parts)||parts.length>64||parts.some(p=>typeof p!=='string'))throw Error('Player key data is missing.');const first=Number(playback.version),second=31-first;
 const chosen=Number.isInteger(first)&&first>=1&&first<=20&&first<=parts.length&&second>0&&second<=parts.length?[parts[first-1],parts[second-1]]:parts;
 const arrays=chosen.map(decodeBase64Bytes),key=new Uint8Array(arrays.reduce((n,a)=>n+a.length,0));let at=0;for(const a of arrays){key.set(a,at);at+=a.length;}
 // Authenticate the GCM tag as well as decrypting the client metadata.
 return plaintext(gcm(key,decodeBase64Bytes(playback.iv)).decrypt(decodeBase64Bytes(playback.payload)));
}
