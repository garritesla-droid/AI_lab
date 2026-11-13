'use strict';
const banks=['Сбербанк','ВТБ','Газпромбанк','Яндекс Банк','БКС Банк'];
const defaults=[[1,1000,3,150,30000],[1.5,1500,4,200,40000],[2,2000,5,250,50000],[1.5,1800,6,100,20000],[1,1200,7,300,60000]];
const sources=[
['https://www.sberbank.ru/ru/person/help/debet_cards_faq/7962?question=26264','Категории и использование бонусов СберСпасибо. Личные категории проверяйте в приложении.'],
['https://www.vtb.ru/personal/karty/debetovye/s-keshbekom/','Категории выбираются ежемесячно; действуют ограничения.'],
['https://www.gazprombank.ru/personal/bonuses-debit-cards/','Для кешбэка баллами требуется выбор категорий. Уточняйте условия своей карты.'],
['https://yandex.ru/support/pay-card/ru/information/cashback','Баллы Плюса и условия их использования отличаются от рублёвого кешбэка. Проверьте подписку.'],
['https://bcs-bank.ru/bonus','Актуальные персональные предложения проверяйте в приложении БКС Банка.']];
const shops=[['Магнит','Продукты'],['Пятёрочка','Продукты'],['Перекрёсток','Продукты'],['Лента','Продукты'],['ВкусВилл','Продукты'],['Ozon','Маркетплейсы'],['Wildberries','Маркетплейсы'],['Яндекс Маркет','Маркетплейсы'],['Яндекс Go','Такси'],['Яндекс Еда','Доставка'],['Купер','Доставка'],['Самокат','Доставка'],['Лукойл','Топливо'],['Роснефть','Топливо'],['Газпромнефть','Топливо'],['Татнефть','Топливо'],['Яндекс Заправки','Топливо через сервис'],['Аптеки','Здоровье'],['Кафе и рестораны','Питание'],['Ашан','Продукты'],['Лэтуаль','Косметика'],['Спортмастер','Спорт'],['Яндекс Афиша','Развлечения'],['РИГЛА','Здоровье'],['Другой магазин / сервис','Другое']];
const norm=s=>s.trim().toLocaleLowerCase('ru-RU');
function calculate(income,spend,balance,rates,basket=[],offers=[],city='',utility=100,subscription=0){
 const [base,cap,interestRate,fee,threshold]=rates;
 const remainder=spend-basket.reduce((s,x)=>s+x.amount,0);
 if(remainder < -0.005)throw new Error('Превышен общий бюджет');
 const lines=basket.map((x,i)=>{const o=offers[i];const match=!!o&&(o.city==='*'||norm(o.city)===norm(city))&&(o.method==='any'||o.method===x.method);return {name:x.name,amount:x.amount,method:x.method,match,offer:o,months:[]};});
 let raw=0,limited=0;
 for(let m=0;m<12;m++){
  let sum=Math.max(0,remainder)*base/100;
  lines.forEach((line,i)=>{const x=basket[i],o=offers[i];const n=line.match&&m<o.months?Math.min(x.amount*o.rate/100,o.cap):(x.method==='card'?x.amount*base/100:0);line.months.push(n);sum+=n;});
  raw+=sum;limited+=Math.min(sum,cap);
 }
 const cashback=limited*utility/100,interest=balance*interestRate/100,cost=income>=threshold?0:fee*12,subscriptions=subscription*12;
 return {cashback,interest,cost,subscriptions,total:cashback+interest-cost-subscriptions,raw,limited,capLoss:raw-limited,lines,remainder};
}
if(typeof module!=='undefined')module.exports={calculate,defaults};
if(typeof document!=='undefined'){
 const $=id=>document.getElementById(id), money=n=>new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(n);
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
 const num=(id,value,max=1e9)=>`<input id="${id}" type="number" min="0" max="${max}" step="0.01" value="${value}" inputmode="decimal">`;
 let selected=[],saved={},report='';
 const city=()=>$('city').value==='other'?$('other-city').value.trim():$('city').value;
 function setRates(){const labels=['Базовый кешбэк, %','Общий лимит, ₽/мес.','На остаток, % годовых','Плата, ₽/мес.','Доход для отмены, ₽/мес.'];$('rates').innerHTML=banks.map((b,i)=>`<tr><td>${b}<small><a href="${sources[i][0]}" target="_blank" rel="noopener noreferrer">Официальные условия</a> · числа ниже — демо / ручной ввод</small></td>${defaults[i].map((v,j)=>`<td><label><span>${labels[j]}</span>${num(`r${i}-${j}`,v,j===0||j===2?100:1e9)}</label></td>`).join('')}</tr>`).join('');}
 $('choices').innerHTML=shops.map(([name,cat],i)=>`<label><input type="checkbox" data-shop="${i}">${name} · ${cat}</label>`).join('');
 function remember(){document.querySelectorAll('#basket input,#basket select,#offers input,#offers select').forEach(e=>saved[e.id]=e.type==='checkbox'?e.checked:e.value);}
 function build(){
 remember();selected=[...document.querySelectorAll('[data-shop]:checked')].map(e=>Number(e.dataset.shop));
 $('basket').innerHTML=selected.map(i=>`<div class="offer"><h3>${shops[i][0]}</h3><div class="fields"><label>Расходы в месяц, ₽${num(`s${i}`,'')}</label><label>Способ оплаты<select id="p${i}"><option value="card">Картой напрямую</option><option value="sbp">Через СБП</option><option value="service">В приложении сервиса</option></select></label></div></div>`).join('');
 $('offers').innerHTML=banks.map((b,k)=>`<details class="offer"><summary>${b}: условия и источники</summary><div class="offer-grid"><label>Используемые бонусы, %${num(`u${k}`,100,100)}</label><label>Подписка, ₽/мес.${num(`sub${k}`,0)}</label></div><small>Для рублей — обычно 100%. Для баллов оцените долю, которую сможете потратить. Подписка — дополнительные расходы сценария.</small>${selected.map(i=>`<details class="offer"><summary>${shops[i][0]}</summary><div class="offer-grid"><label>Ставка, % · ручной ввод${num(`o${k}-${i}-rate`,defaults[k][0],100)}</label><label>Лимит магазина / мес.${num(`o${k}-${i}-cap`,defaults[k][1])}</label><label>Месяцев действия (0–12)${num(`o${k}-${i}-months`,12,12)}</label><label>Регион: * = вся Россия<input id="o${k}-${i}-city" value="*" maxlength="80"></label><label>Действует при оплате<select id="o${k}-${i}-method"><option value="card">Картой напрямую</option><option value="sbp">Через СБП</option><option value="service">В приложении сервиса</option><option value="any">Любым из способов</option></select></label><label>Ссылка на точные условия<input id="o${k}-${i}-url" type="url" placeholder="https://…"></label><label>Дата вашей проверки<input id="o${k}-${i}-date" type="date" max="${today()}"></label><label>Условие / MCC / ограничения<input id="o${k}-${i}-note" maxlength="500" placeholder="Например, категория АЗС активирована"></label></div><label class="choices"><input id="o${k}-${i}-checked" type="checkbox">Я сверил условия с источником для своего продукта</label></details>`).join('')}</details>`).join('');
 Object.entries(saved).forEach(([id,value])=>{const e=$(id);if(e){if(e.type==='checkbox')e.checked=value;else e.value=value;}});
 document.querySelectorAll('[id$="-months"]').forEach(e=>e.step='1');render();
 }
 function offer(k,i){const get=s=>$(`o${k}-${i}-${s}`);return {rate:+get('rate').value,cap:+get('cap').value,months:+get('months').value,city:get('city').value.trim(),method:get('method').value,url:get('url').value,date:get('date').value,note:get('note').value,checked:get('checked').checked};}
 const validURL=s=>{try{const u=new URL(s);return u.protocol==='https:'&&!!u.hostname;}catch{return false;}};
 const verified=o=>o.checked&&validURL(o.url)&&o.date&&o.date<=today()&&o.note.trim();
 function render(){
 $('other-city-label').hidden=$('city').value!=='other';
 const basket=selected.map(i=>({name:shops[i][0],amount:+$(`s${i}`).value,method:$(`p${i}`).value}));
 const allocated=basket.reduce((s,x)=>s+x.amount,0),spend=+$('spend').value;
 $('allocation').textContent=`Распределено: ${money(allocated)}. Прочие покупки: ${money(Math.max(0,spend-allocated))}.`;
 let error=!city()?'Выберите локацию.':'';
 if([...document.querySelectorAll('input[type=number]')].some(e=>e.value===''||!e.validity.valid||!Number.isFinite(e.valueAsNumber)))error='Заполните суммы и тарифы неотрицательными числами. Месяцы — целые, от 0 до 12.';
 if(allocated>spend+0.005)error='Расходы по магазинам превышают общий месячный бюджет. Исправьте распределение.';
 if([...document.querySelectorAll('#offers [id$="-city"]')].some(e=>!e.value.trim()))error='Укажите регион предложения: город или * для всей России.';
 $('download').disabled=!!error;
 if(error){$('status').textContent=error;$('results').innerHTML='';$('analytics').innerHTML='';report='';return;}
 const values=banks.map((b,k)=>calculate(+$('income').value,spend,+$('balance').value,[0,1,2,3,4].map(j=>+$(`r${k}-${j}`).value),basket,selected.map(i=>offer(k,i)),city(),+$(`u${k}`).value,+$(`sub${k}`).value));
 const max=Math.max(...values.map(v=>v.total));
 $('status').textContent='Сценарий на 12 месяцев. Базовые тарифы — демонстрационные / ручные. Максимум модели не является подтверждённым предложением банка.';
 $('results').innerHTML=values.map((v,k)=>`<article class="card${Math.abs(v.total-max)<.005?' best':''}"><div class="rank">${Math.abs(v.total-max)<.005?'МАКСИМУМ СЦЕНАРИЯ':'РАСЧЁТ ПО УСЛОВИЯМ'}</div><h3>${banks[k]}</h3><small><a href="${sources[k][0]}" target="_blank" rel="noopener noreferrer">Правила банка</a> · не подтверждают демо-числа</small><div class="amount">${money(v.total)}</div><dl>${[['Полезный кешбэк',v.cashback],['Проценты',v.interest],['Плата и подписки',v.cost+v.subscriptions]].map(([l,n])=>`<div><dt>${l}</dt><dd>${money(n)}</dd></div>`).join('')}</dl></article>`).join('');
 const detail=(v,k)=>{const rates=[0,1,2,3,4].map(j=>+$(`r${k}-${j}`).value);return `${banks[k]}\nБаза ${rates[0]}%; общий лимит ${money(rates[1])}/мес.; остаток ${rates[2]}% годовых; плата ${money(rates[3])}/мес.; порог ${money(rates[4])}.\nИспользование бонусов ${$(`u${k}`).value}%; подписка ${money(+$(`sub${k}`).value)}/мес.\n${v.lines.map(l=>{const o=l.offer;return `${l.name}: ${money(l.amount)}/мес.; оплата ${l.method}; ${l.match?'регион и оплата совпадают':'регион или оплата не совпадают — базовый режим'}; предложение ${o.rate}%, лимит ${money(o.cap)}/мес., ${o.months} мес., регион ${o.city}, оплата ${o.method}. Начислено за год до общего лимита ${money(l.months.reduce((a,b)=>a+b,0))}. ${verified(o)?'Сверено пользователем':'НЕ ПОДТВЕРЖДЕНО / ДЕМО'}. Дата ${o.date||'не указана'}. ${o.note}. Источник: ${validURL(o.url)?o.url:'не указан'}`;}).join('\n')}\nПрочие покупки ${money(v.remainder)}/мес. по базовой ставке. Начисления до общего лимита ${money(v.raw)}; срезано ${money(v.capLoss)}; после лимита ${money(v.limited)}.\nИтог: ${money(v.cashback)} полезного кешбэка + ${money(v.interest)} процентов − ${money(v.cost)} платы − ${money(v.subscriptions)} подписок = ${money(v.total)}. Отставание от максимума ${money(max-v.total)}.\nОфициальная справка: ${sources[k][0]}\n${sources[k][1]}`;};
 report=[`АНАЛИТИКА · ${new Date().toLocaleDateString('ru-RU')}\nГород ${city()}; доход ${money(+$('income').value)}/мес.; расходы ${money(spend)}/мес.; остаток ${money(+$('balance').value)}.`,`Результаты — модель. Базовые тарифы демонстрационные / ручные. Ссылки не доказывают автоматически введённые ставки. Отчёт содержит ваши введённые суммы.`,...values.map(detail)].join('\n\n');
 $('analytics').innerHTML=`<h3 style="margin-top:24px">Аналитика и доказательства</h3><p>Локация: <strong>${esc(city())}</strong>. Максимум: <strong>${money(max)}</strong> за год. Общие лимиты и полезность баллов учтены.</p>${values.map((v,k)=>`<details class="offer"><summary>${banks[k]} — расчёт и источники</summary><p style="white-space:pre-line">${esc(detail(v,k))}</p>${v.lines.filter(l=>validURL(l.offer.url)).map(l=>`<p><a href="${esc(l.offer.url)}" target="_blank" rel="noopener noreferrer">${esc(l.name)} — источник условий</a></p>`).join('')}<a href="${sources[k][0]}" target="_blank" rel="noopener noreferrer">Официальная справка банка</a></details>`).join('')}<p class="muted">Отчёт для скачивания содержит ваши суммы. Проверьте его перед передачей другим людям.</p>`;
 }
 $('sources').innerHTML=sources.map(([url,note],k)=>`<div class="source-card"><a href="${url}" target="_blank" rel="noopener noreferrer">${banks[k]} — официальные условия</a><p>${note}</p></div>`).join('')+'<p>Проверьте продукт, срок акции, MCC, оплату, регион, лимиты и активацию категории. Название сети само по себе не гарантирует кешбэк.</p>';
 setRates();build();
 document.addEventListener('input',e=>{if(e.target.matches('[data-shop]'))build();else render();});
 document.addEventListener('change',e=>{if(e.target.tagName==='SELECT')render();});
 $('clear').addEventListener('click',()=>{['income','spend','balance'].forEach(id=>$(id).value='');selected.forEach(i=>$(`s${i}`).value='');render();$('income').focus();});
 $('reset').addEventListener('click',()=>{saved={};setRates();$('offers').innerHTML='';build();});
 $('update').addEventListener('click',()=>{$('sources').hidden=!$('sources').hidden;$('update').textContent=$('sources').hidden?'Показать официальные источники':'Скрыть официальные источники';});
 $('download').addEventListener('click',()=>{if(!report)return;const url=URL.createObjectURL(new Blob(['\uFEFF'+report+'\n\n'+(window.publicSnapshotReport?.()||'Публичный срез не получен.')],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='analitika-kart.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
}
