"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patterns = void 0;
const splitCdl = function (cdl) {
    let highTail, body, lowTail;
    if (cdl.close > cdl.open) {
        highTail = cdl.high - cdl.close;
        body = cdl.close - cdl.open;
        lowTail = cdl.open - cdl.low;
    }
    else if (cdl.close < cdl.open) {
        highTail = cdl.high - cdl.open;
        body = cdl.open - cdl.close;
        lowTail = cdl.close - cdl.low;
    }
    return {
        highTail,
        body,
        lowTail
    };
};
function Patterns({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }) {
    const _candles = candlesData;
    const fourthCandle = _candles.slice(-4)[0];
    const thirdCandle = _candles.slice(-3)[0];
    const prevCandle = _candles.slice(-2)[0];
    const lastCandle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'patterns',
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
    const thirdCdlSplit = splitCdl(thirdCandle);
    const prevCdlSplit = splitCdl(prevCandle);
    if ( // hummer
    fourthCandle.close < fourthCandle.open
        && thirdCdlSplit.highTail < thirdCdlSplit.body
        && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
        && thirdCandle.high < fourthCandle.high
        && thirdCandle.high > fourthCandle.low
        && prevCandle.close > prevCandle.open
        && lastPrice > prevCandle.high) {
        long(prevCandle.low);
        console.log(symbol, 'hummer');
    }
    else if ( // shooting star
    fourthCandle.close > fourthCandle.open
        && thirdCdlSplit.highTail > thirdCdlSplit.body * 2
        && thirdCdlSplit.lowTail < thirdCdlSplit.body
        && thirdCandle.low > fourthCandle.low
        && thirdCandle.low < fourthCandle.high
        && prevCandle.close < prevCandle.open
        && lastPrice < prevCandle.low) {
        short(prevCandle.high);
        console.log(symbol, 'shooting star');
    }
    else if ( // hanging man
    thirdCdlSplit.highTail < thirdCdlSplit.body
        && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
        && thirdCandle.high > fourthCandle.high
        && prevCandle.close < prevCandle.open
        && lastPrice < prevCandle.low) {
        short(prevCandle.high);
        console.log(symbol, 'hanging man');
    }
    else if ( // inverted hummer
    thirdCdlSplit.highTail > thirdCdlSplit.body * 2
        && thirdCdlSplit.lowTail < thirdCdlSplit.body
        && thirdCandle.low < fourthCandle.low
        && prevCandle.close > prevCandle.open
        && lastPrice > prevCandle.high) {
        long(prevCandle.low);
        console.log(symbol, 'inverted hummer');
    }
    else if ( // spinning top long
    thirdCdlSplit.highTail > thirdCdlSplit.body * 2
        && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
        && fourthCandle.close < fourthCandle.open
        && prevCandle.close > prevCandle.open
        && prevCdlSplit.highTail * 2 < prevCdlSplit.body
        && lastPrice > prevCandle.high) {
        long(prevCandle.low);
        console.log(symbol, 'spinning top long');
    }
    else if ( // spinning top short
    thirdCdlSplit.highTail > thirdCdlSplit.body * 2
        && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
        && fourthCandle.close > fourthCandle.open
        && prevCandle.close < prevCandle.open
        && prevCdlSplit.lowTail * 2 < prevCdlSplit.body
        && lastPrice < prevCandle.low) {
        short(prevCandle.high);
        console.log(symbol, 'spinning top short');
    }
    else if ( // bullish engulfing
    fourthCandle.close < fourthCandle.open
        && thirdCandle.close < thirdCandle.open
        && prevCandle.close > prevCandle.open
        && prevCandle.close > thirdCandle.high
        && lastPrice > prevCandle.high) {
        long(prevCandle.low);
        console.log(symbol, 'bullish engulfing');
    }
    else if ( // bearish engulfing
    fourthCandle.close > fourthCandle.open
        && thirdCandle.close > thirdCandle.open
        && prevCandle.close < prevCandle.open
        && prevCandle.close < thirdCandle.low
        && lastPrice < prevCandle.low) {
        short(prevCandle.high);
        console.log(symbol, 'bearish engulfing');
    }
    else if ( // tweezer top
    prevCandle.close > prevCandle.open
        && lastCandle.close < lastCandle.open
        && lastCandle.high - lastCandle.open == prevCandle.high - prevCandle.close
        && lastPrice < prevCandle.open) {
        short(prevCandle.high > lastCandle.high ? prevCandle.high : lastCandle.high);
        console.log(symbol, 'tweezer top');
    }
    else if ( // tweezer bottom
    prevCandle.close < prevCandle.open
        && lastCandle.close > lastCandle.open
        && lastCandle.open - lastCandle.low == prevCandle.close - prevCandle.low
        && lastPrice > prevCandle.open) {
        long(prevCandle.low < lastCandle.low ? prevCandle.low : lastCandle.low);
        console.log(symbol, 'tweezer bottom');
    }
    if (symbolResult.resolvePosition) {
        console.log(symbolResult);
    }
    return symbolResult;
}
exports.Patterns = Patterns;
//# sourceMappingURL=patterns.js.map