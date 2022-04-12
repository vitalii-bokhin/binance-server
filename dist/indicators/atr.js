"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ATR = void 0;
const technicalindicators_1 = require("technicalindicators");
function ATR({ data, period }) {
    const candles = [...data], lastCandle = candles.pop();
    const input = {
        high: candles.map(cdl => cdl.high),
        low: candles.map(cdl => cdl.low),
        close: candles.map(cdl => cdl.close),
        period
    };
    const atr = new technicalindicators_1.ATR(input);
    const result = atr.getResult().slice(period * -1);
    result.sort((a, b) => a - b);
    const spreadPercent = (result[result.length - 1] - result[0]) / (result[0] / 100);
    const last = atr.nextValue({
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
    });
    return {
        last: +last.toFixed(5),
        spreadPercent
    };
}
exports.ATR = ATR;
//# sourceMappingURL=atr.js.map