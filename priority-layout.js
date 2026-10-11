(()=>{
  const list=document.getElementById('activeList');
  if(!list)return;
  const siren='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 15V9a4 4 0 0 1 8 0v6"/><path d="M6 15h12l1.5 3H4.5L6 15Z"/><path d="M12 2V1M4.9 4.9 4.2 4.2M19.1 4.9l.7-.7M2 10H1M23 10h-1"/></svg>';
  const decorate=()=>{
    list.querySelectorAll('.taskRow').forEach(row=>{
      if(row.dataset.priorityLayout==='1')return;
      row.dataset.priorityLayout='1';
      const text=row.querySelector('.taskText');
      const urgent=row.querySelector('.urgentToggle');
      const complete=row.querySelector('.completeBtn');
      if(!text||!urgent)return;
      urgent.innerHTML=siren;
      urgent.classList.remove('urgentSiren');
      if(complete)row.insertBefore(urgent,complete);else row.appendChild(urgent);
    });
  };
  new MutationObserver(decorate).observe(list,{childList:true,subtree:true});
  decorate();
})();
