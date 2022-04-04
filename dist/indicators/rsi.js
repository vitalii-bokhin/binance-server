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
    const result = {
        stack: rsi.getResult(),
        last: rsi.nextValue(lastCandle.close),
        avgRsiAbove: 0,
        avgRsiBelow: 0
    };
    let rsiAbove = [];
    let rsiBelow = [];
    // if (result.last > 60) {
    //     rsiAbove.push(result.last);
    // } else if (result.last < 40) {
    //     rsiBelow.push(result.last);
    // }
    result.stack.forEach(el => {
        if (el > 60) {
            rsiAbove.push(el);
        }
        else if (el < 40) {
            rsiBelow.push(el);
        }
    });
    result.avgRsiAbove = rsiAbove.reduce((p, c) => p + c, 0) / rsiAbove.length || 60;
    result.avgRsiBelow = rsiBelow.reduce((p, c) => p + c, 0) / rsiBelow.length || 40;
    return result;
}
exports.RSI = RSI;
//# sourceMappingURL=rsi.js.map