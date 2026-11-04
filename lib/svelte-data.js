/** Decode SvelteKit's public reference table as bounded data, never executable JS. */
export function decodeSvelte(payload,predicate=()=>true) {
 const table=payload?.nodes?.find(node=>node?.type==='data'&&Array.isArray(node.data)&&predicate(node.data[0]))?.data;
 if(!Array.isArray(table)||!table.length||table.length>50000)throw Error('Invalid Svelte source data.');let budget=100000;
 function node(value,seen,depth){if(--budget<0||depth>64)throw Error('Source data exceeds its decoding limit.');if(Array.isArray(value))return value.map(v=>ref(v,seen,depth+1));if(value&&typeof value==='object'){const out={};for(const [key,v]of Object.entries(value)){if(['__proto__','constructor','prototype'].includes(key))continue;out[key]=ref(v,seen,depth+1);}return out;}return value;}
 function ref(value,seen=new Set(),depth=0){if(Number.isInteger(value)&&value>=0&&value<table.length){if(seen.has(value))return null;const next=new Set(seen);next.add(value);return node(table[value],next,depth+1);}return node(value,seen,depth+1);}
 return ref(0);
}
