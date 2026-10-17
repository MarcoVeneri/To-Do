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
  try{return (localStorage.getItem(TOKEN_KEY)||"").trim() || readCookie()}
  catch(e){return readCookie()}
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

// Su iPhone/iPad la barra di inserimento viene sganciata dal contenitore
// dell'app e portata direttamente sotto <body>. In questo modo position:fixed
// resta davvero ancorato al viewport e l'elenco può scorrere dietro la barra.
const composer=document.querySelector("#addForm");
const app=document.querySelector("main.app");
if(composer&&app){
  const home=document.createComment("todo-composer-home");
  app.insertBefore(home,composer);
  const mobileQuery=window.matchMedia("(max-width: 760px)");

  const placeComposer=()=>{
    if(mobileQuery.matches){
      if(composer.parentElement!==document.body)document.body.appendChild(composer);
      document.body.classList.add("todoComposerDetached");
    }else{
      if(home.parentNode&&composer.parentElement!==app)home.parentNode.insertBefore(composer,home.nextSibling);
      document.body.classList.remove("todoComposerDetached");
    }
  };

  placeComposer();
  if(typeof mobileQuery.addEventListener==="function")mobileQuery.addEventListener("change",placeComposer);
  else if(typeof mobileQuery.addListener==="function")mobileQuery.addListener(placeComposer);
}

// La barra di inserimento resta sempre fissa: nessun riposizionamento
// via visualViewport quando compare la tastiera iOS.
})();