"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const technicalindicators_1 = require("technicalindicators");
function candlePatterns({ data }) {
    const candles = [...data];
    candles.pop();
    return {
        BullishEngulfing: BullishEngulfing(candles),
        BearishEngulfing: BearishEngulfing(candles),
        Hammer: Hammer(candles),
        HangingMan: HangingMan(candles),
    };
}
exports.default = candlePatterns;
function BullishEngulfing(candles) {
    const c1 = candles.slice(-2)[0];
    const c2 = candles.slice(-1)[0];
    const input = {
        open: [c1.open, c2.open],
        high: [c1.high, c2.high],
        close: [c1.close, c2.close],
        low: [c1.low, c2.low],
    };
    return (0, technicalindicators_1.bullishengulfingpattern)(input);
}
function BearishEngulfing(candles) {
    const c1 = candles.slice(-2)[0];
    const c2 = candles.slice(-1)[0];
    const input = {
        open: [c1.open, c2.open],
        high: [c1.high, c2.high],
        close: [c1.close, c2.close],
        low: [c1.low, c2.low],
    };
    return (0, technicalindicators_1.bearishengulfingpattern)(input);
}
function Hammer(candles) {
    const c1 = candles.slice(-5)[0];
    const c2 = candles.slice(-4)[0];
    const c3 = candles.slice(-3)[0];
    const c4 = candles.slice(-2)[0];
    const c5 = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3, c4, c5].map(c => c.open),
        high: [c1, c2, c3, c4, c5].map(c => c.high),
        close: [c1, c2, c3, c4, c5].map(c => c.close),
        low: [c1, c2, c3, c4, c5].map(c => c.low),
    };
    return (0, technicalindicators_1.hammerpattern)(input);
}
function HangingMan(candles) {
    const c1 = candles.slice(-5)[0];
    const c2 = candles.slice(-4)[0];
    const c3 = candles.slice(-3)[0];
    const c4 = candles.slice(-2)[0];
    const c5 = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3, c4, c5].map(c => c.open),
        high: [c1, c2, c3, c4, c5].map(c => c.high),
        close: [c1, c2, c3, c4, c5].map(c => c.close),
        low: [c1, c2, c3, c4, c5].map(c => c.low),
    };
    return (0, technicalindicators_1.hangingman)(input);
}
//# sourceMappingURL=candlePatterns.js.map