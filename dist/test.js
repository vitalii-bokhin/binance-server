"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binanceApi_1 = require("./binanceApi");
const indicators_1 = require("./indicators");
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
(0, binanceApi_1.candlesTicks)({ symbols: ['WAVESUSDT'], interval: '5m', limit: 10 }, res => {
    const candles = res['WAVESUSDT'];
    const tdl = (0, indicators_1.TDL)({ candles, topLineOpt, bottomLineOpt });
    console.log(tdl);
});
//# sourceMappingURL=test.js.map