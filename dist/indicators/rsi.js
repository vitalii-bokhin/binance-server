"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RSI = void 0;
const technicalindicators_1 = require("technicalindicators");
function RSI({ data, lng }) {
    const candles = [...data], lastCandle = candles.pop(), inputRSI = {
        values: candles.map(cdl => cdl.close),
        period: lng
    };
    const rsi = new technicalindicators_1.RSI(inputRSI).nextValue(lastCandle.close);
    return rsi;
}
exports.RSI = RSI;
//# sourceMappingURL=rsi.js.map