"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const technicalindicators_1 = require("technicalindicators");
function candlePatterns({ data }) {
    const candles = [...data];
    candles.pop();
    return {
        BullishEngulfing: BullishEngulfing(candles) ? 2 : 0,
        BearishEngulfing: BearishEngulfing(candles) ? 2 : 0,
        Hammer: Hammer(candles) ? 5 : 0,
        HangingMan: HangingMan(candles) ? 5 : 0,
        BullishSpinningTop: BullishSpinningTop(candles) ? 1 : 0,
        BearishSpinningTop: BearishSpinningTop(candles) ? 1 : 0,
        ThreeWhiteSoldiers: ThreeWhiteSoldiers(candles) ? 3 : 0,
        ThreeBlackCrows: ThreeBlackCrows(candles) ? 3 : 0,
    };
}
exports.default = candlePatterns;
function BullishEngulfing(candles) {
    const c1 = candles.slice(-2)[0];
    const c2 = candles.slice(-1)[0];
    return (c1.open > c1.close)
        && (c2.open < c2.close)
        && (c2.open <= c1.close)
        && (c2.close > c1.open);
}
function BearishEngulfing(candles) {
    const c1 = candles.slice(-2)[0];
    const c2 = candles.slice(-1)[0];
    return (c1.open < c1.close)
        && (c2.open > c2.close)
        && (c2.open >= c1.close)
        && (c2.close < c1.open);
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
function BullishSpinningTop(candles) {
    const c = candles.slice(-1)[0];
    const input = {
        open: [c.open],
        high: [c.high],
        close: [c.close],
        low: [c.low],
    };
    return c.open < c.close && (0, technicalindicators_1.bullishspinningtop)(input);
}
function BearishSpinningTop(candles) {
    const c = candles.slice(-1)[0];
    const input = {
        open: [c.open],
        high: [c.high],
        close: [c.close],
        low: [c.low],
    };
    return c.open > c.close && (0, technicalindicators_1.bearishspinningtop)(input);
}
function ThreeWhiteSoldiers(candles) {
    const c1 = candles.slice(-3)[0];
    const c2 = candles.slice(-2)[0];
    const c3 = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3].map(c => c.open),
        high: [c1, c2, c3].map(c => c.high),
        close: [c1, c2, c3].map(c => c.close),
        low: [c1, c2, c3].map(c => c.low),
    };
    return (0, technicalindicators_1.threewhitesoldiers)(input);
}
function ThreeBlackCrows(candles) {
    const c1 = candles.slice(-3)[0];
    const c2 = candles.slice(-2)[0];
    const c3 = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3].map(c => c.open),
        high: [c1, c2, c3].map(c => c.high),
        close: [c1, c2, c3].map(c => c.close),
        low: [c1, c2, c3].map(c => c.low),
    };
    return (0, technicalindicators_1.threeblackcrows)(input);
}
//# sourceMappingURL=candlePatterns.js.map