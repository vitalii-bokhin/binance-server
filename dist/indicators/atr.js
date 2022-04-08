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
    const last = atr.nextValue({
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
    });
    return last;
}
exports.ATR = ATR;
//# sourceMappingURL=atr.js.map