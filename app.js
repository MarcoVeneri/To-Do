(()=>{
"use strict";

const CFG=window.TODO_CONFIG||{};
const TOKEN_KEY="todo_shared_token";
const SHARED_TOKEN_KEYS=["spesa_shared_token","alice-job-radar-access-token-v1"];
const CACHE_KEY="todo_items_cache_v1";
const $=s=>document.querySelector(s);

const ui={
  addForm:$("#addForm"),noteInput:$("#noteInput"),urgentBtn:$("#urgentBtn"),addBtn:$("#addBtn"),
  activeList:$("#activeList"),completedList:$("#completedList"),emptyActive:$("#emptyActive"),
  completedSection:$("#completedSection"),deleteCompletedBtn:$("#deleteCompletedBtn"),
  syncStatus:$("#syncStatus"),connectionBtn:$("#connectionBtn"),
  setupOverlay:$("#setupOverlay"),tokenInput:$("#tokenInput"),saveTokenBtn:$("#saveTokenBtn"),setupMessage:$("#setupMessage"),
  confirmOverlay:$("#confirmOverlay"),cancelDeleteBtn:$("#cancelDeleteBtn"),confirmDeleteBtn:$("#confirmDeleteBtn"),
  toast:$("#toast")
};

let token="";
let items=[];
let loading=false;
let addUrgent=false;
let toastTimer=null;

function esc(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function toast(msg){
  clearTimeout(toastTimer);
  ui.toast.textContent=msg;
  ui.toast.classList.add("show");
  toastTimer=setTimeout(()=>ui.toast.classList.remove("show"),1700);
}
function setStatus(text){ui.syncStatus.textContent=text}
function saveCache(){try{localStorage.setItem(CACHE_KEY,JSON.stringify(items))}catch(e){}}
function loadCache(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||"[]")}catch(e){return[]}}
function setAddUrgent(value){
  addUrgent=!!value;
  ui.urgentBtn.classList.toggle("active",addUrgent);
  ui.urgentBtn.setAttribute("aria-pressed",addUrgent?"true":"false");
  ui.urgentBtn.setAttribute("aria-label",addUrgent?"Nuova nota urgente attiva":"Segna la nuova nota come urgente");
  ui.urgentBtn.title=addUrgent?"Urgente attiva":"Urgente";
}

function ingestHash(){
  const p=new URLSearchParams(location.hash.replace(/^#/,""));
  const k=(p.get("key")||"").trim();
  if(k){
    try{localStorage.setItem(TOKEN_KEY,k)}catch(e){}
    history.replaceState(null,"",location.pathname+location.search);
  }
}
function resolveToken(){
  try{
    let t=(localStorage.getItem(TOKEN_KEY)||"").trim();
    if(t)return t;
    for(const key of SHARED_TOKEN_KEYS){
      t=(localStorage.getItem(key)||"").trim();
      if(t){
        localStorage.setItem(TOKEN_KEY,t);
        return t;
      }
    }
  }catch(e){}
  return "";
}
function storeToken(v){
  token=(v||"").trim();
  try{localStorage.setItem(TOKEN_KEY,token)}catch(e){}
}

function headers(){
  return {"apikey":CFG.publishableKey,"Content-Type":"application/json","x-client-info":"marco-todo/1.0"};
}
async function rpc(name,args){
  const r=await fetch(String(CFG.url||"").replace(/\/$/,"")+"/rest/v1/rpc/"+name,{
    method:"POST",headers:headers(),body:JSON.stringify(args),cache:"no-store"
  });
  if(!r.ok){
    const text=await r.text();
    const err=new Error(text||("HTTP "+r.status));
    err.status=r.status;
    throw err;
  }
  const ct=r.headers.get("content-type")||"";
  return ct.includes("application/json")?r.json():r.text();
}

function activeItems(){
  return items.filter(x=>!x.completed).sort((a,b)=>Number(b.urgent)-Number(a.urgent)||String(b.created_at||"").localeCompare(String(a.created_at||"")));
}
function completedItems(){
  return items.filter(x=>x.completed).sort((a,b)=>String(b.completed_at||"").localeCompare(String(a.completed_at||"")));
}

function activeRow(x){
  return `<article class="taskRow ${x.urgent?"urgent":""}" data-id="${esc(x.id)}">
    <button class="urgentToggle" type="button" data-urgent="${esc(x.id)}" aria-label="${x.urgent?"Togli urgenza":"Segna urgente"}" title="${x.urgent?"Togli urgenza":"Segna urgente"}"><span class="urgentDot"></span></button>
    <div class="taskText">${esc(x.note)}</div>
    <button class="completeBtn" type="button" data-complete="${esc(x.id)}" aria-label="Segna come completata" title="Completata"><span class="checkCircle"></span></button>
  </article>`;
}
function completedRow(x){
  return `<article class="completedRow" data-id="${esc(x.id)}">
    <div class="completedText">${esc(x.note)}</div>
    <span class="doneMark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 12.5 3.5 3.5L18 7.5"/></svg></span>
    <button class="restoreBtn" type="button" data-restore="${esc(x.id)}" aria-label="Ripristina" title="Ripristina"><svg viewBox="0 0 24 24"><path d="M8 8H4v-4"/><path d="M4.5 8A8 8 0 1 1 5 17"/></svg></button>
  </article>`;
}
function render(){
  const active=activeItems(),done=completedItems();
  ui.activeList.innerHTML=active.map(activeRow).join("");
  ui.completedList.innerHTML=done.map(completedRow).join("");
  ui.emptyActive.hidden=active.length>0;
  ui.completedSection.hidden=done.length===0;

  ui.activeList.querySelectorAll("[data-urgent]").forEach(el=>el.addEventListener("click",()=>toggleUrgent(el.dataset.urgent)));
  ui.activeList.querySelectorAll("[data-complete]").forEach(el=>el.addEventListener("click",()=>completeItem(el.dataset.complete)));
  ui.completedList.querySelectorAll("[data-restore]").forEach(el=>el.addEventListener("click",()=>restoreItem(el.dataset.restore)));
}

function markBusy(id,busy=true){
  const row=document.querySelector(`[data-id="${CSS.escape(String(id))}"]`);
  if(row)row.classList.toggle("removing",busy);
}

async function refresh({silent=false}={}){
  if(!token||loading)return;
  loading=true;
  if(!silent)setStatus("Sincronizzazione…");
  try{
    const data=await rpc("todo_get_items",{p_token:token});
    items=Array.isArray(data)?data:[];
    saveCache();
    render();
    setStatus("Sincronizzato");
    return true;
  }catch(e){
    console.warn(e);
    const cached=loadCache();
    if(cached.length||!items.length){items=cached;render()}
    if(e.status===401||e.status===403){
      setStatus("Codice non valido");
      if(!silent)openSetup("Il codice privato non è valido.");
    }else{
      setStatus(navigator.onLine?"Errore sincronizzazione":"Offline");
      if(!silent)toast("Connessione non disponibile");
    }
    return false;
  }finally{loading=false}
}

async function addItem(){
  const note=ui.noteInput.value.trim();
  if(!note||!token)return;
  ui.addBtn.disabled=true;
  ui.urgentBtn.disabled=true;
  try{
    await rpc("todo_add_item",{p_token:token,p_note:note,p_urgent:addUrgent});
    ui.noteInput.value="";
    setAddUrgent(false);
    await refresh({silent:true});
    setStatus("Sincronizzato");
    ui.noteInput.focus();
  }catch(e){
    toast("Non riesco ad aggiungere la nota");
  }finally{
    ui.addBtn.disabled=false;
    ui.urgentBtn.disabled=false;
  }
}

async function toggleUrgent(id){
  const x=items.find(v=>String(v.id)===String(id));
  if(!x)return;
  const next=!x.urgent;
  x.urgent=next;render();
  try{
    await rpc("todo_set_urgent",{p_token:token,p_item_id:id,p_urgent:next});
    await refresh({silent:true});
  }catch(e){
    x.urgent=!next;render();toast("Urgenza non salvata");
  }
}

async function completeItem(id){
  markBusy(id,true);
  try{
    await rpc("todo_complete_item",{p_token:token,p_item_id:id});
    await refresh({silent:true});
  }catch(e){markBusy(id,false);toast("Modifica non salvata")}
}
async function restoreItem(id){
  markBusy(id,true);
  try{
    await rpc("todo_restore_item",{p_token:token,p_item_id:id});
    await refresh({silent:true});
  }catch(e){markBusy(id,false);toast("Ripristino non riuscito")}
}
async function deleteCompleted(){
  ui.confirmDeleteBtn.disabled=true;
  try{
    const n=Number(await rpc("todo_delete_completed",{p_token:token}))||0;
    closeDeleteConfirm();
    await refresh({silent:true});
    toast(n===1?"1 completata eliminata":`${n} completate eliminate`);
  }catch(e){toast("Eliminazione non riuscita")}
  finally{ui.confirmDeleteBtn.disabled=false}
}

function openSetup(message=""){
  ui.setupMessage.textContent=message;
  ui.tokenInput.value="";
  ui.setupOverlay.hidden=false;
  setTimeout(()=>ui.tokenInput.focus(),80);
}
function closeSetup(){ui.setupOverlay.hidden=true}
async function saveSetupToken(){
  const t=ui.tokenInput.value.trim();
  if(t.length<20){ui.setupMessage.textContent="Inserisci il codice privato completo.";return}
  ui.saveTokenBtn.disabled=true;
  const old=token;
  storeToken(t);
  const ok=await refresh({silent:true});
  if(ok){closeSetup();toast("Sincronizzazione attivata")}
  else{storeToken(old);ui.setupMessage.textContent="Codice non valido o servizio non raggiungibile."}
  ui.saveTokenBtn.disabled=false;
}
function openDeleteConfirm(){ui.confirmOverlay.hidden=false}
function closeDeleteConfirm(){ui.confirmOverlay.hidden=true}

ui.addForm.addEventListener("submit",e=>{e.preventDefault();addItem()});
ui.urgentBtn.addEventListener("click",()=>setAddUrgent(!addUrgent));
ui.deleteCompletedBtn.addEventListener("click",openDeleteConfirm);
ui.cancelDeleteBtn.addEventListener("click",closeDeleteConfirm);
ui.confirmDeleteBtn.addEventListener("click",deleteCompleted);
ui.connectionBtn.addEventListener("click",()=>openSetup(""));
ui.saveTokenBtn.addEventListener("click",saveSetupToken);
ui.tokenInput.addEventListener("keydown",e=>{if(e.key==="Enter")saveSetupToken()});
ui.confirmOverlay.addEventListener("click",e=>{if(e.target===ui.confirmOverlay)closeDeleteConfirm()});

document.addEventListener("visibilitychange",()=>{if(!document.hidden&&token)refresh({silent:true})});
window.addEventListener("online",()=>{if(token)refresh({silent:true})});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js?v=1.0.2",{updateViaCache:"none"}).then(r=>r.update()).catch(()=>{}));
}

ingestHash();
token=resolveToken();
items=loadCache();
setAddUrgent(false);
render();
if(!token){setStatus("Sincronizzazione da configurare");openSetup()}
else refresh();
setInterval(()=>{if(!document.hidden&&token)refresh({silent:true})},5000);

})();
