"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LVL = void 0;
const getSignal = function (cdl, prevCdl, levelOpt) {
    const priceOnLine = levelOpt.price;
    const spread = levelOpt.spread;
    let signal;
    if (cdl.high > priceOnLine - spread && prevCdl.low < priceOnLine - spread) {
        signal = 'nextToBottom';
    }
    else if (cdl.low < priceOnLine + spread && prevCdl.high > priceOnLine + spread) {
        signal = 'nextToTop';
    }
    if (cdl.high > priceOnLine + spread && prevCdl.low < priceOnLine - spread) {
        signal = 'crossAbove';
    }
    else if (cdl.low < priceOnLine - spread && prevCdl.high > priceOnLine + spread) {
        signal = 'crossBelow';
    }
    return signal;
};
function LVL({ symbol, candles, levelOpt }) {
    let signal;
    const thirdCdl = candles[candles.length - 3];
    const secondCdl = candles[candles.length - 2];
    const curCdl = candles[candles.length - 1];
    const lastSignal = getSignal(secondCdl, thirdCdl, levelOpt);
    if (lastSignal == 'nextToBottom' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread) {
        signal = 'bounceDown';
    }
    else if (lastSignal == 'nextToTop' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price + levelOpt.spread) {
        signal = 'bounceUp';
    }
    else if (lastSignal == 'crossBelow' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread) {
        signal = 'crossBelow';
    }
    else if (lastSignal == 'crossAbove' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price + levelOpt.spread) {
        signal = 'crossAbove';
    }
    return signal;
}
exports.LVL = LVL;
//# sourceMappingURL=level.js.map