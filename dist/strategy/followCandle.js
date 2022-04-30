"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FollowCandle = void 0;
const technicalindicators_1 = require("technicalindicators");
const indicators_1 = require("../indicators");
const candle_1 = require("../indicators/candle");
const cache = {};
function FollowCandle({ symbol, candlesData, tiSettings }) {
    const _candles = candlesData;
    // const sma = SMA({ data: _candles, period: 50 }).last;
    const haCandles = _candles.slice(-14);
    const haData = {
        open: haCandles.map(c => c.open),
        close: haCandles.map(c => c.close),
        high: haCandles.map(c => c.high),
        low: haCandles.map(c => c.low)
    };
    const ha = (0, technicalindicators_1.heikinashi)(haData);
    const prevCandleHa = {
        high: ha.high.slice(-2)[0],
        open: ha.open.slice(-2)[0],
        close: ha.close.slice(-2)[0],
        low: ha.low.slice(-2)[0],
        openTime: null
    };
    const lastCandleHa = {
        high: ha.high.slice(-1)[0],
        open: ha.open.slice(-1)[0],
        close: ha.close.slice(-1)[0],
        low: ha.low.slice(-1)[0],
        openTime: null
    };
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod }).last;
    const lastCandle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'follow_candle',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false,
        atr
    };
    const long = function (stopLoss) {
        if (true /* lastPrice > sma */) {
            if (lastPrice - stopLoss < atr) {
                stopLoss = lastPrice - atr;
            }
            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    };
    const short = function (stopLoss) {
        if (true /* lastPrice < sma */) {
            if (stopLoss - lastPrice < atr) {
                stopLoss = lastPrice + atr;
            }
            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    };
    if ((0, candle_1.CheckCandle)(prevCandleHa) !== 'has_tails') {
        if (prevCandleHa.close > prevCandleHa.open
            && lastCandleHa.close > lastCandleHa.open) {
            long(prevCandleHa.low);
        }
        else if (prevCandleHa.close < prevCandleHa.open
            && lastCandleHa.close < lastCandleHa.open) {
            short(prevCandleHa.high);
        }
    }
    return symbolResult;
}
exports.FollowCandle = FollowCandle;
//# sourceMappingURL=followCandle.js.map