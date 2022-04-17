"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LVL = void 0;
function LVL({ symbol, candles, levelOpt }) {
    let signal;
    let prevSignal;
    const lvlPrice = [...levelOpt.price];
    lvlPrice.sort((a, b) => b - a);
    const thirdCdl = candles[candles.length - 3];
    const secondCdl = candles[candles.length - 2];
    const curCdl = candles[candles.length - 1];
    const topLvlPrice = lvlPrice[0];
    const bottomLvlPrice = lvlPrice[1];
    if (thirdCdl.low < bottomLvlPrice
        && secondCdl.high > bottomLvlPrice) {
        prevSignal = 'nextToBottom';
    }
    else if (thirdCdl.high > topLvlPrice
        && secondCdl.low < topLvlPrice) {
        prevSignal = 'nextToTop';
    }
    if (prevSignal == 'nextToBottom') {
        if (secondCdl.close < topLvlPrice) {
            prevSignal = 'bounceDown';
        }
        else {
            prevSignal = 'crossAbove';
        }
    }
    else if (prevSignal == 'nextToTop') {
        if (secondCdl.close > bottomLvlPrice) {
            prevSignal = 'bounceUp';
        }
        else {
            prevSignal = 'crossBelow';
        }
    }
    if ((prevSignal == 'bounceDown' || prevSignal == 'crossBelow')
        && curCdl.close < bottomLvlPrice
        && curCdl.close < curCdl.open) {
        signal = prevSignal;
    }
    else if ((signal == 'bounceUp' || signal == 'crossAbove')
        && curCdl.close > topLvlPrice
        && curCdl.close > curCdl.open) {
        signal = prevSignal;
    }
    else {
        signal = null;
    }
    return { topLvlPrice, bottomLvlPrice, signal };
}
exports.LVL = LVL;
//# sourceMappingURL=level.js.map