// import { TradesList, TradesListStream } from './binance_api';
// import { candlesTicksStream, DepthStream } from './binance_api/binanceApi';
// import { LVL, TDL } from './indicators';

import { test2Var } from './test2';

// const lineOpt = {
//     start: {
//         price: 23.7273,
//         time: { d: 9, h: 21, m: 55 }
//     },
//     end: {
//         price: 24.4211,
//         time: { d: 10, h: 1, m: 55 }
//     },
//     spread: .15
// };

// candlesTicksStream({ symbols: ['WAVESUSDT'], interval: '5m', limit: 50 }, res => {
//     const candles = res['WAVESUSDT'];

//     // const tdl = TDL({ candles, lineOpt, symbol: 'WAVESUSDT' });

//     const lvl = LVL({ candles, levelOpt: {price: 25.7594, spread: .2}, symbol: 'WAVESUSDT' });

//     // console.log('TDL===' + tdl);
//     console.log('LVL===' + lvl);
// });

// DepthStream(['WAVESUSDT'], data => {
//     console.log('RES');
//     console.log('ask', data['WAVESUSDT'].asks/* .sort((a, b) => +a[0] - +b[0]) */.slice(0, 15));
//     console.log('bid', data['WAVESUSDT'].bids/* .sort((a, b) => +b[0] - +a[0]) */.slice(0, 15));
//     let highA: number = 0;
//     let priceA: string;
//     let high: number = 0;
//     let price: string;

//     data['WAVESUSDT'].asks.slice(0, 50).forEach(it => {
//         if (+it[1] > highA) {
//             highA = +it[1];
//             priceA = it[0];
//         }
//     });

//     data['WAVESUSDT'].bids.slice(0, 50).forEach(it => {
//         if (+it[1] > high) {
//             high = +it[1];
//             price = it[0];
//         }
//     });

//     console.log('max Ask');
//     console.log(priceA, highA);
//     console.log('max Bid');
//     console.log(price, high);
// });

// const lvl = {};

// TradesList(['WAVESUSDT'], data => {
//     data['WAVESUSDT'].forEach(it => {
//         if (lvl[it.price] === undefined) {
//             lvl[it.price] = +it.qty;
//         } else {
//             lvl[it.price] += +it.qty;
//         }
//     });

//     TradesListStream(['WAVESUSDT'], res => {
//         if (lvl[res.price] === undefined) {
//             lvl[res.price] = +res.qty;
//         } else {
//             lvl[res.price] += +res.qty;
//         }

//         const arr = Object.entries(lvl);

//         arr.sort((a: any, b: any) => b[1] - a[1]);

//         console.log(arr.slice(0,10));

//     });
// });

// let symb = 'dsas';

// console.log(!symb);

// setInterval(function() {
//     console.log(test2Var);
// }, 5000);

console.log(['a','b','c','d','e','f'].slice(-5,-2));