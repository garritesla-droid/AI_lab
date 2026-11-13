'use strict';
(() => {
 const $=id=>document.getElementById(id);
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const names={'mention':'Только упоминание','partner-list':'В публичном списке партнёров','special-product':'Отдельная совместная карта','payment-support':'Поддержка способа оплаты','category':'Правила категории','payment-service':'Платёжный сервис','rules':'Правила акции','partners':'Партнёрские условия'};
 let snapshot=null,failed=false;
 window.publicSnapshotReport=()=>snapshot ? `${failed?'ПОСЛЕДНЕЕ ОБНОВЛЕНИЕ НЕ УДАЛОСЬ. Ниже предыдущий срез.\n':''}ПУБЛИЧНЫЙ СРЕЗ ${snapshot.finishedAt}\nПрочитано ${snapshot.coverage.read} из ${snapshot.coverage.attempted} источников.\n${snapshot.limitations.join('\n')}\n${snapshot.sources.map(s=>`\n[${s.id}] ${s.title}\nПервоисточник: ${s.url}\nПроверка: ${s.checkedAt}; статус: ${s.status}; SHA-256: ${s.hash||'нет'}\n${s.error||''}\n${s.excerpt?'Короткий фрагмент источника: '+s.excerpt:''}\n${s.facts.map(f=>`${f.bank} / ${f.merchant||'общие правила'}: ${names[f.type]||f.type}. ${f.claim} ${f.advertisedRate?'На странице: '+f.advertisedRate+' (не подтверждённая персональная ставка).':''}\nИсточник: ${s.url}\nДля расчёта не хватает: ${f.missing.join('; ')}.`).join('\n')}`).join('\n')}`:'Публичный срез ещё не получен. Актуальность тарифов не подтверждена.';
 function draw(){
  if(!snapshot)return;
  const chosen=[...document.querySelectorAll('[data-shop]:checked')].map(e=>e.parentElement.textContent.split(' · ')[0].trim());
  $('snapshot-result').innerHTML=`<p><strong>Прочитано ${snapshot.coverage.read} из ${snapshot.coverage.attempted} источников.</strong> Получено: ${escape(new Date(snapshot.finishedAt).toLocaleString('ru-RU'))}.</p><p>Полных условий для автоматического подтверждения годовой выгоды нет. Срез не меняет демонстрационные ставки. ${chosen.length?'Ниже — сведения о выбранных магазинах и общие правила.':'Выберите магазины, чтобы сузить список.'}</p>${snapshot.sources.map(s=>{
   const facts=s.facts.filter(f=>!chosen.length||!f.merchant||chosen.includes(f.merchant));
   return `<details class="offer"><summary>${escape(s.title)} — ${s.status==='read'?'прочитан':'недоступен'}</summary><p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">Открыть первоисточник</a> · ${escape(new Date(s.checkedAt).toLocaleString('ru-RU'))}</p>${s.status!=='read'?`<p>${escape(s.error)}. Отсутствие доступа не означает отсутствие предложения.</p>`:`<small>Контрольная сумма текста: ${escape(s.hash)}</small><blockquote>${escape(s.excerpt)}</blockquote>${facts.length?facts.map(f=>`<div class="source-card"><strong>${escape(f.bank)} · ${escape(f.merchant||'Общие правила')}</strong><p>${escape(names[f.type]||f.type)}. ${escape(f.claim)}</p>${f.advertisedRate?`<p>На странице: <strong>${escape(f.advertisedRate)}</strong>. Это рекламное значение, не подтверждённая персональная ставка.</p>`:''}<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">Доказательство этого сведения</a><small>Не включено автоматически в выгоду. Не хватает: ${escape(f.missing.join('; '))}.</small></div>`).join(''):'<p>Сведений о выбранных магазинах в распознанном тексте не найдено. Это не доказательство отсутствия сотрудничества.</p>'}`}</details>`;
  }).join('')}<details class="offer"><summary>Границы проверки</summary><ul>${snapshot.limitations.map(s=>`<li>${escape(s)}</li>`).join('')}</ul></details>`;
  $('snapshot-download').disabled=false;
 }
 $('refresh-public').addEventListener('click',async()=>{
  $('refresh-public').disabled=true;$('snapshot-status').textContent='Загружаем официальные страницы заново. Обычно до 30 секунд…';
  try{
   const root=String(window.FIVE_CARDS_API||'').replace(/\/$/,'');
   if(location.protocol==='file:')throw new Error('Откройте сайт через сервис или GitHub Pages. При открытии HTML двойным щелчком обновление недоступно.');
   const response=await fetch(root+'/api/snapshot',{method:'POST',cache:'no-store',signal:AbortSignal.timeout(35000)});
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('Сервис обновления ещё не подключён. Укажите его адрес в config.js по инструкции README.');
   const data=await response.json();if(!response.ok)throw new Error(data.error||`Ошибка ${response.status}`);
   if(data.schemaVersion!==1||!Array.isArray(data.sources))throw new Error('Неподдерживаемый ответ сервиса');
   // Only official allowlisted origins may become evidence links.
   const hosts=new Set(['www.sberbank.ru','www.vtb.ru','www.gazprombank.ru','yandex.ru','bcs-bank.ru','magnit.ru']);
   for(const s of data.sources){const u=new URL(s.url);if(u.protocol!=='https:'||!hosts.has(u.hostname)||!Array.isArray(s.facts))throw new Error('Некорректный источник в ответе сервиса');}
   snapshot=data;failed=false;$('snapshot-status').textContent=data.coverage.read===data.coverage.attempted?'Обход завершён. Проверьте полноту условий ниже.':'Срез частичный: некоторые источники недоступны. Подробности ниже.';draw();
  }catch(e){failed=true;$('snapshot-status').textContent=`Обновление не выполнено: ${e.message}${snapshot?' Показан предыдущий срез с прежней датой.':''}`;}
  finally{$('refresh-public').disabled=false;}
 });
 $('snapshot-download').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob(['\uFEFF'+window.publicSnapshotReport()],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='publichnye-istochniki.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 document.addEventListener('change',e=>{if(e.target.matches('[data-shop]'))draw();});
})();
