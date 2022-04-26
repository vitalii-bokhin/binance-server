"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SMA = void 0;
const technicalindicators_1 = require("technicalindicators");
function SMA({ data, period }) {
    const candles = [...data], lastCandle = candles.pop(), input = {
        values: candles.map(cdl => cdl.close),
        period
    };
    // inputHigh = {
    //     values: candles.map(cdl => cdl.high),
    //     period
    // },
    // inputLow = {
    //     values: candles.map(cdl => cdl.low),
    //     period
    // }
    const sma = new technicalindicators_1.SMA(input);
    // const smaH = new tiSma(inputHigh);
    // const smaL = new tiSma(inputLow);
    return {
        stack: sma.getResult(),
        // stackHigh: smaH.getResult(),
        // stackLow: smaL.getResult(),
        last: sma.nextValue(lastCandle.close)
    };
}
exports.SMA = SMA;
//# sourceMappingURL=sma.js.map