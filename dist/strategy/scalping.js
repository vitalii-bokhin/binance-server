"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scalping = void 0;
const bot_1 = require("../bot");
const indicators_1 = require("../indicators");
const candle_1 = require("../indicators/candle");
let dd = false;
function Scalping({ symbol, candlesData, tiSettings }) {
    const _candles = candlesData;
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod }).last;
    const prevCandle = _candles[_candles.length - 2];
    const lastCandle = _candles[_candles.length - 1];
    const lastPrice = lastCandle.close;
    const cdlHiLo = lastCandle.high - lastCandle.low;
    const moved = cdlHiLo / atr;
    const depth = (0, bot_1.getDepthCache)(symbol);
    if (depth) {
        if (depth.maxAsk.volume > depth.maxBid.volume && lastPrice >= depth.maxAsk.price) {
            dd = true;
        }
        else if (depth.maxAsk.volume < depth.maxBid.volume && lastPrice <= depth.maxBid.price) {
            dd = true;
        }
    }
    console.log(dd);
    console.log(depth);
    console.log(lastPrice);
    const signalDetails = {
        lastPrice: lastPrice,
        atr,
        moved
    };
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        signal: 'scalping',
        strategy: 'scalping',
        preferIndex: atr / cdlHiLo,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };
    const stoplossRate = atr * .15;
    if (moved > .2 && moved < .5) {
        if (lastCandle.close > lastCandle.open /* && prevCandle.close > prevCandle.open */) {
            const checkPrev = (0, candle_1.CheckCandle)(prevCandle, 'long');
            if ((lastCandle.high - lastCandle.close) / (lastCandle.open - lastCandle.low) < .2 &&
                checkPrev != 'stopLong') {
                // Long
                const stopLoss = lastPrice - stoplossRate;
                const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;
                symbolResult.position = 'long';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } /* else if (lastCandle.open - lastCandle.low < (lastCandle.high - lastCandle.close) / 2) {
                // Short
                const stopLoss = lastPrice + stoplossRate;
                const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

                symbolResult.position = 'short';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } */
        }
        else if (lastCandle.close < lastCandle.open /* && prevCandle.close < prevCandle.open */) {
            const checkPrev = (0, candle_1.CheckCandle)(prevCandle, 'short');
            if ((lastCandle.close - lastCandle.low) / (lastCandle.high - lastCandle.open) < .2 &&
                checkPrev != 'stopShort') {
                // Short
                const stopLoss = lastPrice + stoplossRate;
                const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;
                symbolResult.position = 'short';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } /* else if (lastCandle.high - lastCandle.open < (lastCandle.close - lastCandle.low) / 2) {
                // Long
                const stopLoss = lastPrice - stoplossRate;
                const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

                symbolResult.position = 'long';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } */
        }
    }
    return symbolResult;
}
exports.Scalping = Scalping;
//# sourceMappingURL=scalping.js.map