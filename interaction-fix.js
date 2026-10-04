(()=>{
"use strict";

const TOKEN_KEY="todo_shared_token";
const TOKEN_COOKIE="todo_sync_token";

function readCookie(){
  try{
    const prefix=TOKEN_COOKIE+"=";
    const part=document.cookie.split("; ").find(v=>v.startsWith(prefix));
    return part?decodeURIComponent(part.slice(prefix.length)).trim():"";
  }catch(e){return ""}
}

function savedToken(){
  try{
    return (localStorage.getItem(TOKEN_KEY)||"").trim() || readCookie();
  }catch(e){
    return readCookie();
  }
}

const syncBtn=document.querySelector("#connectionBtn");
if(syncBtn){
  syncBtn.addEventListener("click",e=>{
    if(!savedToken())return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const status=document.querySelector("#syncStatus");
    if(status)status.textContent="Sincronizzazione…";
    location.reload();
  },true);
}
})();
