import { candlesTicks } from './binanceApi';
import { TDL } from './indicators';


const topLineOpt = [
    {
        price: 30.4315,
        time: { d: 8, h: 4, m: 30 }
    },
    {
        price: 27.0748,
        time: { d: 9, h: 0, m: 45 }
    }
];
const bottomLineOpt = [
    {
        price: 29.8772,
        time: { d: 8, h: 3, m: 15 }
    },
    {
        price: 26.4089,
        time: { d: 9, h: 0, m: 25 }
    }
];

candlesTicks({symbols:['WAVESUSDT'], interval: '5m', limit: 10}, res => {
    const candles = res['WAVESUSDT'];

    const tdl = TDL({candles, topLineOpt, bottomLineOpt});

    console.log(tdl);
});