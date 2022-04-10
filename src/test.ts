// import { candlesTicksStream } from './binanceApi';
// import { LVL, TDL } from './indicators';

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