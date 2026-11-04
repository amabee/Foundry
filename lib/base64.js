/** Small, bounded UTF-8 decoder for public embedded data in QuickJS. */
export function decodeBase64Bytes(value) {
 if(typeof value!=='string'||value.length>65536)throw Error('Encoded source data exceeds its limit.');
 const input=value.replace(/\s/g,'').replace(/-/g,'+').replace(/_/g,'/');if(!/^[A-Za-z0-9+/]*={0,2}$/.test(input)||input.length%4===1)throw Error('Invalid encoded source data.');
 const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',bytes=[];let bits=0,n=0;
 for(const c of input){if(c==='=')break;n=(n<<6)|alphabet.indexOf(c);bits+=6;if(bits>=8){bits-=8;bytes.push((n>>bits)&255);}}
 return Uint8Array.from(bytes);
}
export function decodeBase64(value) {
 const bytes=decodeBase64Bytes(value);
 try{return decodeURIComponent([...bytes].map(b=>'%'+b.toString(16).padStart(2,'0')).join(''));}catch{throw Error('Invalid UTF-8 source data.');}
}
