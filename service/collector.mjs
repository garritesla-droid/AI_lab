import {createHash} from 'node:crypto';
import {SOURCES,MERCHANTS} from './sources.mjs';
export function plain(html){return html.replace(/<(script|style|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ').replace(/<!--[\s\S]*?-->/g,' ').replace(/<[^>]+>/g,' ').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,v)=>{const n=v[0].toLowerCase()==='x'?parseInt(v.slice(1),16):+v;return n<=0x10ffff?String.fromCodePoint(n):' ';}).replace(/&(?:nbsp|ensp|emsp);/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&(?:lt|gt);/g,' ').replace(/\s+/g,' ').trim();}
const lower=s=>s.toLocaleLowerCase('ru-RU').replace(/ё/g,'е');
export function parseSource(source,html,checkedAt=new Date().toISOString()){
 const text=plain(html),normalized=lower(text);
 if(text.length<150||!source.signals.every(s=>normalized.includes(lower(s))))throw new Error('Страница не распознана: возможна защита сайта или изменение структуры');
 const position=Math.max(0,normalized.indexOf(lower(source.signals[0])));
 const excerpt=text.slice(position).split(/\s+/).slice(0,20).join(' ');
 const facts=[];
 // Mentions do not establish a partnership or a rate. Each fact retains its source.
 for(const merchant of MERCHANTS){
  if(!normalized.includes(lower(merchant)))continue;
  let type='mention',claim='Название найдено в публичном тексте. Сотрудничество и выгода не установлены.';
  if(source.kind==='partners'){
   const start=normalized.indexOf('предложения от'),end=normalized.indexOf('как это работает',start);
   const section=normalized.slice(start,end>start?end:start+2500);
   if(section.includes(lower(merchant))){type='partner-list';claim='Магазин указан в разделе партнёров банка. Условия конкретного продукта требуют проверки.';}
  }
  if(source.kind==='special-product'&&merchant===source.merchant){type='special-product';claim='Найдена страница отдельного совместного продукта. Условия не переносятся на обычную зарплатную карту.';}
  if(source.kind==='merchant-payment'&&merchant==='Магнит'){type='payment-support';claim='Магазин публикует справку об оплате через Яндекс Пэй. Это не доказательство конкретной ставки кешбэка.';}
  let advertisedRate=null;
  if(type==='partner-list'){
   const start=normalized.indexOf('предложения от'),at=normalized.indexOf(lower(merchant),start);
   const next=MERCHANTS.filter(m=>m!==merchant).map(m=>normalized.indexOf(lower(m),at+merchant.length)).filter(n=>n>at);
   const end=Math.min(at+240,...next);
   const block=text.slice(at,end),match=block.match(/к[еэ]шб[еэ]к\s*(до\s*)?(\d{1,2}(?:[.,]\d+)?)\s*%/i);
   if(match)advertisedRate=`${match[1]?'до ':''}${match[2]}%`;
  }
  facts.push({merchant,bank:source.bank,type,claim,advertisedRate,sourceIds:[source.id],calculationEligible:false,missing:['точный продукт и доступность клиенту','действующая ставка и лимиты','срок предложения','регион и способ оплаты','совместимость с другими бонусами']});
 }
 if(!facts.length)facts.push({merchant:null,bank:source.bank,type:source.kind,claim:'Доступен публичный источник правил. Полный набор условий для автоматического расчёта не установлен.',sourceIds:[source.id],calculationEligible:false,missing:['проверенные условия конкретного предложения']});
 return {id:source.id,bank:source.bank,title:source.title,url:source.url,status:'read',checkedAt,hash:createHash('sha256').update(text).digest('hex'),excerpt,facts};
}
export async function fetchSource(source,fetcher=fetch){
 const checkedAt=new Date().toISOString();
 try{
  // Redirects cannot escape the allowlist. A changed URL requires curator review.
  const response=await fetcher(source.url,{redirect:'error',signal:AbortSignal.timeout(12000),headers:{'User-Agent':'FiveCardsPublicResearch/1.0','Accept':'text/html','Cache-Control':'no-cache'}});
  if(!response.ok)throw new Error(`Источник вернул HTTP ${response.status}`);
  if(!/text\/html/i.test(response.headers.get('content-type')||''))throw new Error('Неподдерживаемый формат источника');
  const reader=response.body.getReader();let size=0;const chunks=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000){await reader.cancel();throw new Error('Источник превышает лимит размера');}chunks.push(value);}
  return parseSource(source,Buffer.concat(chunks).toString('utf8'),checkedAt);
 }catch(error){return {id:source.id,bank:source.bank,title:source.title,url:source.url,status:'unavailable',checkedAt,error:error.name==='TimeoutError'?'Источник не ответил за 12 секунд':error.message,facts:[]};}
}
export async function collect(fetcher=fetch){
 const startedAt=new Date().toISOString(),results=[];
 // Bounded concurrency; each button press starts a fresh pass.
 for(let i=0;i<SOURCES.length;i+=4)results.push(...await Promise.all(SOURCES.slice(i,i+4).map(s=>fetchSource(s,fetcher))));
 return {schemaVersion:1,startedAt,finishedAt:new Date().toISOString(),sources:results,coverage:{attempted:results.length,read:results.filter(s=>s.status==='read').length},limitations:['Это обход заданного списка официальных страниц, не поиск всего интернета.','Дата загрузки страницы не подтверждает срок действия акции.','Текстовые упоминания не подтверждают партнёрство.','Персональные предложения, закрытые приложения и защищённые страницы могут быть недоступны.','Числа из рекламы и неполные условия не включаются автоматически в калькулятор.']};
}
