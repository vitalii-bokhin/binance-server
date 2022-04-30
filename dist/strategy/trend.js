"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trend = void 0;
const candle_1 = require("../indicators/candle");
const cache = {};
function Trend({ symbol, candlesData, tiSettings }) {
    if (!cache[symbol]) {
        cache[symbol] = {
            startPrice: null
        };
    }
    const _candles = candlesData;
    const lastCandle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;
    if (cache[symbol].startPrice === null) {
        cache[symbol].startPrice = lastPrice;
    }
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'trend',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: null
    };
    const long = function (stopLoss) {
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        if (lastCandle.close > lastCandle.open
            && (0, candle_1.CheckCandle)(lastCandle) != 'has_tails') {
            symbolResult.resolvePosition = true;
        }
    };
    const short = function (stopLoss) {
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        if (lastCandle.close < lastCandle.open
            && (0, candle_1.CheckCandle)(lastCandle) != 'has_tails') {
            symbolResult.resolvePosition = true;
        }
    };
    const changePercent = (lastPrice - cache[symbol].startPrice) / (cache[symbol].startPrice / 100);
    if (Math.abs(changePercent) > .3) {
        if (changePercent > 0) {
            long(lastCandle.low);
        }
        else {
            short(lastCandle.high);
        }
        cache[symbol].startPrice = null;
    }
    return symbolResult;
}
exports.Trend = Trend;
//# sourceMappingURL=trend.js.map