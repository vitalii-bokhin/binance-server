import { candlesTicks } from './binanceApi';
import { TDL } from './indicators';


const topLineOpt = [
    {
        price: 30.4315,
        time: { d: 8, h: 4, m: 30 }
    },
    {
        price: 29.4921,
        time: { d: 8, h: 10, m: 15 }
    },
];
const bottomLineOpt = [
    {
        price: 29.9266,
        time: { d: 8, h: 2, m: 10 }
    },
    {
        price: 29.3618,
        time: { d: 8, h: 10, m: 20 }
    },
];

candlesTicks({symbols:['WAVESUSDT'], interval: '5m', limit: 10}, res => {
    const candles = res['WAVESUSDT'];

    TDL({candles, topLineOpt, bottomLineOpt});
});