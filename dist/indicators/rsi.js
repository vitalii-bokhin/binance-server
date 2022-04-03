"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSI = void 0;
const technicalindicators_1 = require("technicalindicators");
function RSI({ data, period }) {
    const candles = [...data], lastCandle = candles.pop(), input = {
        values: candles.map(cdl => cdl.close),
        period
    };
    const rsi = new technicalindicators_1.RSI(input);
    return {
        stack: rsi.getResult(),
        last: rsi.nextValue(lastCandle.close)
    };
}
exports.RSI = RSI;
//# sourceMappingURL=rsi.js.map