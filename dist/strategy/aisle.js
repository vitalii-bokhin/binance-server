"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aisle = void 0;
const indicators_1 = require("../indicators");
function Aisle({ symbol, candlesData, tiSettings, tdlOpt, lvlOpt }) {
    const _candles = candlesData;
    // const tdl = TDL({ candles: _candles, lineOpt: tdlOpt[0], symbol });
    const lvl0 = (0, indicators_1.LVL)({ candles: _candles, levelOpt: lvlOpt[0], symbol });
    const lvl1 = (0, indicators_1.LVL)({ candles: _candles, levelOpt: lvlOpt[1], symbol });
    const lvl2 = (0, indicators_1.LVL)({ candles: _candles, levelOpt: lvlOpt[2], symbol });
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod });
    const lastCandle = _candles[_candles.length - 1];
    const lastPrice = lastCandle.close;
    const prevCandle = _candles[_candles.length - 2];
    const thirdCandle = _candles[_candles.length - 3];
    const fourthCandle = _candles[_candles.length - 4];
    const fifthCandle = _candles[_candles.length - 5];
    const candles = _candles.slice(tiSettings.smaPeriod * -1);
    let maxCandleMove = 0, minCandleMove = 9999, avgCandleMove = 0, percentAverageCandleMove = 0;
    candles.pop();
    candles.forEach(cdl => {
        if (cdl.high - cdl.low > maxCandleMove) {
            maxCandleMove = cdl.high - cdl.low;
        }
        if (cdl.high - cdl.low < minCandleMove) {
            minCandleMove = cdl.high - cdl.low;
        }
        avgCandleMove += cdl.high - cdl.low;
        percentAverageCandleMove += (cdl.high - cdl.low) / (cdl.low / 100);
    });
    minCandleMove = minCandleMove || 9999;
    avgCandleMove = avgCandleMove / candles.length;
    percentAverageCandleMove = percentAverageCandleMove / candles.length;
    const signalDetails = {
        lastPrice,
        percentAverageCandleMove,
        minCandleMove,
        avgCandleMove,
        lastCandleMove: lastCandle.open - lastCandle.close,
        prevCandleClose: prevCandle.close,
        atr,
        candleHasOpened: false
    };
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'aisle',
        preferIndex: percentAverageCandleMove,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };
    if ((lvl0.signal == 'bounceUp' || lvl1.signal == 'bounceUp' || lvl2.signal == 'bounceUp') &&
        lastCandle.close - lastCandle.open >= minCandleMove) {
        let stopLoss = lastPrice - atr;
        // if (stopLoss > tdl.bottomLinePrice) {
        //     stopLoss = tdl.bottomLinePrice;
        // }
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;
        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
        lvl0.clearChache();
        lvl1.clearChache();
        lvl2.clearChache();
    }
    else if ((lvl0.signal == 'bounceDown' || lvl1.signal == 'bounceDown' || lvl2.signal == 'bounceDown') &&
        lastCandle.open - lastCandle.close >= minCandleMove) {
        let stopLoss = lastPrice + atr;
        // if (stopLoss < tdl.topLinePrice) {
        //     stopLoss = tdl.topLinePrice + atr;
        // }
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;
        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
        lvl0.clearChache();
        lvl1.clearChache();
        lvl2.clearChache();
    }
    return symbolResult;
}
exports.Aisle = Aisle;
//# sourceMappingURL=aisle.js.map