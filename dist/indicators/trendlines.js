"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDL = void 0;
const getTime = function ({ d, h, m }) {
    return new Date(2022, 3, d, h, m).getTime();
};
const priceOnLine = function (line, time) {
    return ((time - getTime(line[0].time)) / (getTime(line[0].time) - getTime(line[1].time))) * (line[0].price - line[1].price) + line[0].price;
};
function TDL({ candles, topLineOpt, bottomLineOpt }) {
    const thirdCdl = candles[candles.length - 3];
    const prevCdl = candles[candles.length - 2];
    const lastCdl = candles[candles.length - 1];
    const prevTopLinePrice = priceOnLine(topLineOpt, prevCdl.openTime);
    const prevBottomLinePrice = priceOnLine(bottomLineOpt, prevCdl.openTime);
    const prevSpread = (prevTopLinePrice - prevBottomLinePrice) / 10;
    const lastTopLinePrice = priceOnLine(topLineOpt, lastCdl.openTime);
    const lastBottomLinePrice = priceOnLine(bottomLineOpt, lastCdl.openTime);
    const lastSpread = (lastTopLinePrice - lastBottomLinePrice) / 10;
    // console.log(prevCdl);
    // console.log(prevTopLinePrice);
    // console.log(prevBottomLinePrice);
    let signal = null;
    if (thirdCdl.low < prevTopLinePrice &&
        prevCdl.open < prevTopLinePrice &&
        prevCdl.close > prevTopLinePrice &&
        lastCdl.close > lastTopLinePrice + lastSpread) {
        signal = 'crossAboveTop';
    }
    else if (thirdCdl.high > prevTopLinePrice &&
        prevCdl.open > prevTopLinePrice &&
        prevCdl.close < prevTopLinePrice &&
        lastCdl.close < lastTopLinePrice - lastSpread) {
        signal = 'crossBelowTop';
    }
    else if (thirdCdl.high > prevBottomLinePrice &&
        prevCdl.open > prevBottomLinePrice &&
        prevCdl.close < prevBottomLinePrice &&
        lastCdl.close < lastBottomLinePrice - lastSpread) {
        signal = 'crossBelowBottom';
    }
    else if (thirdCdl.low < prevBottomLinePrice &&
        prevCdl.open < prevBottomLinePrice &&
        prevCdl.close > prevBottomLinePrice &&
        lastCdl.close > lastBottomLinePrice + lastSpread) {
        signal = 'crossAboveBottom';
    }
    else if (thirdCdl.low < prevTopLinePrice &&
        prevCdl.low < prevTopLinePrice &&
        prevCdl.high >= prevTopLinePrice - prevSpread &&
        lastCdl.close < lastTopLinePrice - lastSpread) {
        signal = 'underTop';
    }
    else if (thirdCdl.high > prevBottomLinePrice &&
        prevCdl.high > prevBottomLinePrice &&
        prevCdl.low <= prevBottomLinePrice + prevSpread &&
        lastCdl.close > lastBottomLinePrice + lastSpread) {
        signal = 'overBottom';
    }
    else if (thirdCdl.high > prevTopLinePrice &&
        prevCdl.high > prevTopLinePrice &&
        prevCdl.low <= prevTopLinePrice + prevSpread &&
        lastCdl.close > lastTopLinePrice + lastSpread) {
        signal = 'overTop';
    }
    else if (thirdCdl.low < prevBottomLinePrice &&
        prevCdl.low < prevBottomLinePrice &&
        prevCdl.high >= prevBottomLinePrice - prevSpread &&
        lastCdl.close < lastBottomLinePrice - lastSpread) {
        signal = 'underBottom';
    }
    // console.log(signal);
    return {
        signal,
        topLinePrice: lastTopLinePrice,
        bottomLinePrice: lastBottomLinePrice
    };
}
exports.TDL = TDL;
//# sourceMappingURL=trendlines.js.map