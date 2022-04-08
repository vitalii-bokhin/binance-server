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
(0, binanceApi_1.candlesTicks)({ symbols: ['WAVESUSDT'], interval: '5m', limit: 10 }, res => {
    const candles = res['WAVESUSDT'];
    (0, indicators_1.TDL)({ candles, topLineOpt, bottomLineOpt });
});
//# sourceMappingURL=test.js.map