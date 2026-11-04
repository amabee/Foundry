// Read serialized JSON data only. Never execute a site's inline scripts.
export function flightData(html) {
  let data="";
  for(const match of html.matchAll(/self\.__next_f\.push\((\[1,"(?:[^"\\]|\\.)*"\])\)/g)) {
    try {data+=JSON.parse(match[1])[1];}catch{throw Error("Invalid serialized reader data.");}
  }
  return data;
}
export function jsonArray(data,key) {
  const match=new RegExp('"'+key+'"\\s*:\\s*\\[').exec(data);
  if(!match)throw Error("Reader page data is missing.");
  const start=match.index+match[0].length-1;
  let depth=0,quoted=false,escape=false;
  for(let i=start;i<data.length;i++) {
    const c=data[i];
    if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}
    if(c==='"')quoted=true;
    else if(c==='[')depth++;
    else if(c===']'&&--depth===0){try{return JSON.parse(data.slice(start,i+1));}catch{break;}}
  }
  throw Error("Invalid reader page array.");
}
