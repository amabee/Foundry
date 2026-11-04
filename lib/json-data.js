/** Read one strict JSON value after a reviewed marker, ignoring surrounding JS. */
export function jsonAfter(text,pattern) {
 const match=pattern.exec(text);if(!match)throw Error('Source JSON data is missing.');
 const start=match.index+match[0].length;let at=start;while(/\s/.test(text[at]??''))at++;
 const open=text[at],close=open==='{'?'}':open==='['?']':null;if(!close)throw Error('Source JSON value is invalid.');
 const stack=[],begin=at;let quoted=false,escape=false;
 for(;at<text.length;at++){const c=text[at];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue;}if(c==='"'){quoted=true;continue;}if(c==='{'||c==='[')stack.push(c);else if(c==='}'||c===']'){const was=stack.pop();if(was!==(c==='}'?'{':'['))break;if(!stack.length){try{return JSON.parse(text.slice(begin,at+1));}catch{break;}}}if(stack.length>64)break;}
 throw Error('Source JSON data is invalid.');
}
