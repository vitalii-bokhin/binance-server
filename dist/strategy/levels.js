"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Levels = void 0;
const indicators_1 = require("../indicators");
let i = 0, j = 0;
function Levels({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }) {
    const _candles = candlesData;
    const tdl = (0, indicators_1.TDL)({ candles: _candles, trendsOpt });
    const lvl = (0, indicators_1.LVL)({ candles: _candles, levelsOpt });
    const lastCandle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'levels',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false
    };
    const long = function (stopLoss) {
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        symbolResult.resolvePosition = true;
    };
    const short = function (stopLoss) {
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        symbolResult.resolvePosition = true;
    };
    if (lvl.signal == 'onLevel') {
        // console.log(symbol);
        // console.log(lvl);
        // console.log(i++);
        if (lvl.direction == 'up'
            && lastPrice > lvl.topPrice
            && lastCandle.close > lastCandle.open
            && lastPrice - lvl.topPrice < lvl.topPrice - lvl.bottomPrice) {
            long(lvl.bottomPrice);
        }
        else if (lvl.direction == 'down'
            && lastPrice < lvl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lvl.bottomPrice - lastPrice < lvl.topPrice - lvl.bottomPrice) {
            short(lvl.topPrice);
        }
    }
    if (tdl.signal == 'onTrend') {
        // console.log(symbol);
        // console.log(tdl);
        // console.log(j++);
        if (tdl.direction == 'up'
            && lastPrice > tdl.topPrice
            && lastCandle.close > lastCandle.open
            && lastPrice - tdl.topPrice < tdl.topPrice - tdl.bottomPrice) {
            long(tdl.bottomPrice);
        }
        else if (tdl.direction == 'down'
            && lastPrice < tdl.bottomPrice
            && lastCandle.close < lastCandle.open
            && tdl.bottomPrice - lastPrice < tdl.topPrice - tdl.bottomPrice) {
            short(tdl.topPrice);
        }
    }
    // console.log(symbolResult);
    return symbolResult;
}
exports.Levels = Levels;
//# sourceMappingURL=levels.js.map