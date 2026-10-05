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

const noteInput=document.querySelector("#noteInput");
const addForm=document.querySelector("#addForm");
const vv=window.visualViewport;
let raf=0;
let blurTimer=0;

function updateComposerPosition(){
  if(!noteInput||!addForm||!document.body.classList.contains("noteEntryActive"))return;
  cancelAnimationFrame(raf);
  raf=requestAnimationFrame(()=>{
    const rowHeight=addForm.offsetHeight||68;
    const gap=8;
    if(vv){
      const visibleBottom=vv.offsetTop+vv.height;
      const top=Math.max(vv.offsetTop+gap,visibleBottom-rowHeight-gap);
      document.documentElement.style.setProperty("--todo-composer-top",`${Math.round(top)}px`);
    }else{
      const top=Math.max(gap,window.innerHeight-rowHeight-gap);
      document.documentElement.style.setProperty("--todo-composer-top",`${Math.round(top)}px`);
    }
  });
}

function activateEntry(){
  if(!noteInput||!addForm||window.matchMedia("(min-width:561px)").matches)return;
  clearTimeout(blurTimer);
  document.body.classList.add("noteEntryActive");
  updateComposerPosition();
  setTimeout(updateComposerPosition,60);
  setTimeout(updateComposerPosition,220);
}

function deactivateEntry(){
  clearTimeout(blurTimer);
  blurTimer=setTimeout(()=>{
    if(document.activeElement===noteInput)return;
    document.body.classList.remove("noteEntryActive");
    document.documentElement.style.removeProperty("--todo-composer-top");
  },120);
}

if(noteInput&&addForm){
  noteInput.addEventListener("focus",activateEntry);
  noteInput.addEventListener("blur",deactivateEntry);
  window.addEventListener("orientationchange",()=>setTimeout(updateComposerPosition,180));
  window.addEventListener("resize",updateComposerPosition,{passive:true});
  if(vv){
    vv.addEventListener("resize",updateComposerPosition,{passive:true});
    vv.addEventListener("scroll",updateComposerPosition,{passive:true});
  }
}
})();
