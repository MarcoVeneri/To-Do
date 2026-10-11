(()=>{
  const list=document.getElementById('activeList');
  if(!list)return;

  const clean=()=>{
    list.querySelectorAll('.taskRow').forEach(row=>{
      row.querySelectorAll('.urgentToggle').forEach(btn=>btn.remove());
    });
  };

  new MutationObserver(clean).observe(list,{childList:true,subtree:true});
  clean();
})();
