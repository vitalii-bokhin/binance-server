"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Patterns = void 0;
const indicators_1 = require("../indicators");
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
    return { highTail, body, lowTail };
};
function Patterns({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }) {
    const _candles = candlesData;
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod }).last;
    const cdl_3 = _candles.slice(-4)[0];
    const cdl_2 = _candles.slice(-3)[0];
    const cdl_1 = _candles.slice(-2)[0];
    const cdl_0 = _candles.slice(-1)[0];
    const lastPrice = cdl_0.close;
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
    const cdl_2_Split = splitCdl(cdl_2);
    const cdl_1_Split = splitCdl(cdl_1);
    if ( // inside bar
    cdl_2_Split.highTail * 2 < cdl_2_Split.body
        && cdl_2_Split.lowTail * 2 < cdl_2_Split.body
        && cdl_1_Split.highTail * 2 < cdl_1_Split.body
        && cdl_1_Split.lowTail * 2 < cdl_1_Split.body
        && cdl_2.high > cdl_1.high
        && cdl_2.low < cdl_1.low) {
        if ( // long
        lastPrice > cdl_2.high) {
            long(cdl_2.low);
        }
        else if ( // short
        lastPrice < cdl_2.low) {
            short(cdl_2.high);
        }
    }
    /* if (
        cdl_2_Split.highTail <= cdl_2_Split.body
        && cdl_2.high - cdl_2.low < atr * 1.5
        && cdl_1_Split.highTail <= cdl_1_Split.body
        && cdl_1.high - cdl_1.low < atr * 1.5
        && lastPrice > cdl_1.high
    ) {
        long(cdl_1.low);

    } else if (
        cdl_2_Split.lowTail <= cdl_2_Split.body
        && cdl_2.high - cdl_2.low < atr * 1.5
        && cdl_1_Split.lowTail <= cdl_1_Split.body
        && cdl_1.high - cdl_1.low < atr * 1.5
        && lastPrice < cdl_1.low
    ) {
        short(cdl_1.high);
    } */
    /* if ( // outside bar long
        cdl_3.close < cdl_3.open
        && cdl_2.close < cdl_2.open
        && cdl_1.close > cdl_1.open
        && cdl_1.low < cdl_2.low
        && cdl_1.close > cdl_2.high
        && lastPrice > cdl_1.high
    ) {
        long(cdl_1.low);
        console.log(symbol, 'outside bar long');

    } else if ( // outside bar short
        cdl_3.close > cdl_3.open
        && cdl_2.close > cdl_2.open
        && cdl_1.close < cdl_1.open
        && cdl_1.high > cdl_2.high
        && cdl_1.close < cdl_2.low
        && lastPrice < cdl_1.low
    ) {
        short(cdl_1.high);
        console.log(symbol, 'outside bar short');

    } else if ( // inside bar long
        cdl_2.high > cdl_1.high
        && cdl_2.low < cdl_1.low
        && lastPrice > cdl_1.high
    ) {
        long(cdl_1.low);
        console.log(symbol, 'inside bar long');

    } else if ( // inside bar short
        cdl_2.high > cdl_1.high
        && cdl_2.low < cdl_1.low
        && lastPrice < cdl_1.low
    ) {
        short(cdl_1.high);
        console.log(symbol, 'inside bar short');

    } else */
    /*if ( // pinbar long
        cdl_2.close < cdl_2.open
        && cdl_1_Split.lowTail > cdl_1_Split.body * 2
        && cdl_1_Split.lowTail > cdl_1_Split.highTail * 3
        && lastPrice > cdl_1.high
    ) {
        long(cdl_1.low);
        console.log(symbol, 'pinbar long');

    } else if ( // pinbar short
        cdl_2.close > cdl_2.open
        && cdl_1_Split.highTail > cdl_1_Split.body * 2
        && cdl_1_Split.highTail > cdl_1_Split.lowTail * 3
        && lastPrice < cdl_1.low
    ) {
        short(cdl_1.high);
        console.log(symbol, 'pinbar short');

    } else if ( // hanging man
        cdl_2.close > cdl_2.open
        && cdl_1_Split.lowTail > cdl_1_Split.highTail * 3
        && cdl_1_Split.lowTail > cdl_1_Split.body * 2
        && lastPrice < cdl_1.low + ((cdl_1.high - cdl_1.low) / 2)
    ) {
        short(cdl_1.high);
        console.log(symbol, 'hanging man');

    } else if ( // inverted hummer
        cdl_2.close < cdl_2.open
        && cdl_1_Split.highTail > cdl_1_Split.lowTail * 3
        && cdl_1_Split.highTail > cdl_1_Split.body * 2
        && lastPrice > cdl_1.high - ((cdl_1.high - cdl_1.low) / 2)
    ) {
        long(cdl_1.low);
        console.log(symbol, 'inverted hummer');

    }  else if ( // spinning top long
        cdl_1_Split.lowTail > cdl_1_Split.body * 2
        && cdl_1_Split.highTail > cdl_1_Split.body * 2
        && cdl_1_Split.highTail / cdl_1_Split.lowTail < 2
        && cdl_1_Split.highTail / cdl_1_Split.lowTail > .5
        && lastPrice > cdl_1.high
    ) {
        long(cdl_1.low);
        console.log(symbol, 'spinning top long');

    } else if ( // spinning top short
        cdl_1_Split.lowTail > cdl_1_Split.body * 2
        && cdl_1_Split.highTail > cdl_1_Split.body * 2
        && cdl_1_Split.highTail / cdl_1_Split.lowTail < 2
        && cdl_1_Split.highTail / cdl_1_Split.lowTail > .5
        && lastPrice < cdl_1.low
    ) {
        short(cdl_1.high);
        console.log(symbol, 'spinning top short');
    } */
    // if ( // hummer
    //     fourthCandle.close < fourthCandle.open
    //     && thirdCdlSplit.highTail < thirdCdlSplit.body
    //     && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
    //     && thirdCandle.high < fourthCandle.high
    //     && thirdCandle.high > fourthCandle.low
    //     && prevCandle.close > prevCandle.open
    //     && lastPrice > prevCandle.high
    // ) {
    //     long(prevCandle.low);
    //     console.log(symbol, 'hummer');
    // } else if ( // shooting star
    //     fourthCandle.close > fourthCandle.open
    //     && thirdCdlSplit.highTail > thirdCdlSplit.body * 2
    //     && thirdCdlSplit.lowTail < thirdCdlSplit.body
    //     && thirdCandle.low > fourthCandle.low
    //     && thirdCandle.low < fourthCandle.high
    //     && prevCandle.close < prevCandle.open
    //     && lastPrice < prevCandle.low
    // ) {
    //     short(prevCandle.high);
    //     console.log(symbol, 'shooting star');
    // } else if ( // hanging man
    //     thirdCdlSplit.highTail < thirdCdlSplit.body
    //     && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
    //     && thirdCandle.high > fourthCandle.high
    //     && prevCandle.close < prevCandle.open
    //     && lastPrice < prevCandle.low
    // ) {
    //     short(prevCandle.high);
    //     console.log(symbol, 'hanging man');
    // } else if ( // inverted hummer
    //     thirdCdlSplit.highTail > thirdCdlSplit.body * 2
    //     && thirdCdlSplit.lowTail < thirdCdlSplit.body
    //     && thirdCandle.low < fourthCandle.low
    //     && prevCandle.close > prevCandle.open
    //     && lastPrice > prevCandle.high
    // ) {
    //     long(prevCandle.low);
    //     console.log(symbol, 'inverted hummer');
    // } else if ( // spinning top long
    //     thirdCdlSplit.highTail > thirdCdlSplit.body * 2
    //     && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
    //     && fourthCandle.close < fourthCandle.open
    //     && prevCandle.close > prevCandle.open
    //     && prevCdlSplit.highTail * 2 < prevCdlSplit.body
    //     && lastPrice > prevCandle.high
    // ) {
    //     long(prevCandle.low);
    //     console.log(symbol, 'spinning top long');
    // } else if ( // spinning top short
    //     thirdCdlSplit.highTail > thirdCdlSplit.body * 2
    //     && thirdCdlSplit.lowTail > thirdCdlSplit.body * 2
    //     && fourthCandle.close > fourthCandle.open
    //     && prevCandle.close < prevCandle.open
    //     && prevCdlSplit.lowTail * 2 < prevCdlSplit.body
    //     && lastPrice < prevCandle.low
    // ) {
    //     short(prevCandle.high);
    //     console.log(symbol, 'spinning top short');
    // } else if ( // bullish engulfing
    //     fourthCandle.close < fourthCandle.open
    //     && thirdCandle.close < thirdCandle.open
    //     && prevCandle.close > prevCandle.open
    //     && prevCandle.close > thirdCandle.high
    //     && lastPrice > prevCandle.high
    // ) {
    //     long(prevCandle.low);
    //     console.log(symbol, 'bullish engulfing');
    // } else if ( // bearish engulfing
    //     fourthCandle.close > fourthCandle.open
    //     && thirdCandle.close > thirdCandle.open
    //     && prevCandle.close < prevCandle.open
    //     && prevCandle.close < thirdCandle.low
    //     && lastPrice < prevCandle.low
    // ) {
    //     short(prevCandle.high);
    //     console.log(symbol, 'bearish engulfing');
    // } else if ( // tweezer top
    //     prevCandle.close > prevCandle.open
    //     && lastCandle.close < lastCandle.open
    //     && lastCandle.high - lastCandle.open == prevCandle.high - prevCandle.close
    //     && lastPrice < prevCandle.open
    // ) {
    //     short(prevCandle.high > lastCandle.high ? prevCandle.high : lastCandle.high);
    //     console.log(symbol, 'tweezer top');
    // } else if ( // tweezer bottom
    //     prevCandle.close < prevCandle.open
    //     && lastCandle.close > lastCandle.open
    //     && lastCandle.open - lastCandle.low == prevCandle.close - prevCandle.low
    //     && lastPrice > prevCandle.open
    // ) {
    //     long(prevCandle.low < lastCandle.low ? prevCandle.low : lastCandle.low);
    //     console.log(symbol, 'tweezer bottom');
    // }
    // if (symbolResult.resolvePosition) {
    //     console.log(symbolResult);
    // }
    return symbolResult;
}
exports.Patterns = Patterns;
//# sourceMappingURL=patterns%20copy.js.map