// Fixed public-source allowlist. Visitors cannot submit URLs to the fetcher.
export const SOURCES = [
 {id:'sber',bank:'Сбербанк',url:'https://www.sberbank.ru/ru/person/help/debet_cards_faq/7962?question=26264',title:'СберСпасибо: официальная справка',signals:['СберСпасибо'],kind:'category'},
 {id:'vtb',bank:'ВТБ',url:'https://www.vtb.ru/personal/karty/debetovye/s-keshbekom/',title:'ВТБ: кешбэк',signals:['кешбэк','категори'],kind:'category'},
 {id:'vtb-magnit',bank:'ВТБ',url:'https://www.vtb.ru/personal/karty/debetovye/magnit/',title:'ВТБ: отдельная карта Магнит',signals:['Магнит','карт'],kind:'special-product',merchant:'Магнит'},
 {id:'gpb',bank:'Газпромбанк',url:'https://www.gazprombank.ru/personal/bonuses-debit-cards/',title:'Газпромбанк: бонусные карты',signals:['Газпромбанк','кешбэк'],kind:'category'},
 {id:'yandex',bank:'Яндекс Банк',url:'https://yandex.ru/support/pay/ru/cashback',title:'Яндекс Пэй: кешбэк и ограничения',signals:['Кешбэк баллами Плюса','кнопка'],kind:'payment-service'},
 {id:'bcs',bank:'БКС Банк',url:'https://bcs-bank.ru/bonus',title:'БКС: категории и партнёры',signals:['Предложения от','партнеров БКС'],kind:'partners'},
 {id:'magnit',bank:'Яндекс Банк',url:'https://magnit.ru/faq/servisy-oplaty',title:'Магнит: сервисы оплаты',signals:['Яндекс Пэй','QR-код Магнита'],kind:'merchant-payment',merchant:'Магнит'},
 {id:'yandex-rules',bank:'Яндекс Банк',url:'https://yandex.ru/legal/card_and_pay_points/ru/',title:'Яндекс Пэй: правила акции',signals:['Акци','Партнер'],kind:'rules'}
];
export const MERCHANTS=['Магнит','Пятёрочка','Перекрёсток','Лента','ВкусВилл','Ozon','Wildberries','Яндекс Маркет','Яндекс Go','Яндекс Еда','Купер','Самокат','Лукойл','Роснефть','Газпромнефть','Татнефть','Яндекс Заправки','Ашан','Лэтуаль','Спортмастер','Яндекс Афиша','РИГЛА','DeLonghi'];
