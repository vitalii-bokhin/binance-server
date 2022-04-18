"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LVL = void 0;
function LVL({ candles, levelsOpt }) {
    let signal = null;
    const lastCandles = candles.slice(-3);
    const prePrevCdl = lastCandles[0];
    const prevCdl = lastCandles[1];
    let topLvlPrice, bottomLvlPrice;
    for (const level of levelsOpt) {
        const lvlPrice = [...level.price];
        lvlPrice.sort((a, b) => b - a);
        topLvlPrice = lvlPrice[0];
        bottomLvlPrice = lvlPrice[1];
        if (prePrevCdl.low < bottomLvlPrice
            && prevCdl.high > bottomLvlPrice) {
            signal = 'nextToBottom';
        }
        else if (prePrevCdl.high > topLvlPrice
            && prevCdl.low < topLvlPrice) {
            signal = 'nextToTop';
        }
    }
    // if (prevSignal == 'nextToBottom') {
    //     if (prevCdl.close < topLvlPrice) {
    //         prevSignal = 'bounceDown';
    //     } else {
    //         prevSignal = 'crossAbove';
    //     }
    // } else if (prevSignal == 'nextToTop') {
    //     if (prevCdl.close > bottomLvlPrice) {
    //         prevSignal = 'bounceUp';
    //     } else {
    //         prevSignal = 'crossBelow';
    //     }
    // }
    // if (
    //     (prevSignal == 'bounceDown' || prevSignal == 'crossBelow')
    //     && curCdl.close < bottomLvlPrice
    //     && curCdl.close < curCdl.open
    // ) {
    //     signal = prevSignal;
    // } else if (
    //     (signal == 'bounceUp' || signal == 'crossAbove')
    //     && curCdl.close > topLvlPrice
    //     && curCdl.close > curCdl.open
    // ) {
    //     signal = prevSignal;
    // } else {
    //     signal = null;
    // }
    return { signal, topLvlPrice, bottomLvlPrice };
}
exports.LVL = LVL;
//# sourceMappingURL=level.js.map