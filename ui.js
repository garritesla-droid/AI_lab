'use strict';
(()=>{
 const tabs=[...document.querySelectorAll('[data-pane]')];
 function show(name,focus=true){tabs.forEach(t=>{const active=t.dataset.pane===name;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById('pane-'+t.dataset.pane).hidden=!active;if(active&&focus)t.focus();});}
 tabs.forEach((t,i)=>{t.addEventListener('click',()=>show(t.dataset.pane));t.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;show(tabs[next].dataset.pane);});});
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{show(b.dataset.go);document.querySelector('.tabs').scrollIntoView({block:'start'});}));
})();
