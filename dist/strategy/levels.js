"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Levels = void 0;
const indicators_1 = require("../indicators");
const cache = {};
function Levels({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }) {
    // runDepthStream();
    // if (!cache[symbol]) {
    //     cache[symbol] = {
    //         levelsByDepth: {
    //             asks: [],
    //             bids: []
    //         }
    //     };
    // }
    // const depth = depthCache[symbol];
    // if (depth) {
    //     if (
    //         !cache[symbol].levelsByDepth.asks.length
    //         || cache[symbol].levelsByDepth.asks.slice(-1)[0].price !== depth.maxAsk.price
    //     ) {
    //         cache[symbol].levelsByDepth.asks.push({
    //             price: depth.maxAsk.price,
    //             volume: depth.maxAsk.volume
    //         });
    //     }
    //     if (
    //         !cache[symbol].levelsByDepth.bids.length
    //         || cache[symbol].levelsByDepth.bids.slice(-1)[0].price !== depth.maxBid.price
    //     ) {
    //         cache[symbol].levelsByDepth.bids.push({
    //             price: depth.maxBid.price,
    //             volume: depth.maxBid.volume
    //         });
    //     }
    // }
    // const askLevels = cache[symbol].levelsByDepth.asks.slice(-3);
    // const bidLevels = cache[symbol].levelsByDepth.bids.slice(-3);
    // askLevels.sort((a, b) => a.price - b.price);
    // bidLevels.sort((a, b) => b.price - a.price);
    // console.log(symbol);
    // console.log('askLevels');
    // console.log(askLevels);
    // console.log('bidLevels');
    // console.log(bidLevels);
    const _candles = candlesData;
    // const smaLast = SMA({ data: _candles, period: tiSettings.smaPeriod }).last;
    // const smaStack = SMA({ data: _candles, period: tiSettings.smaPeriod }).stack;
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod }).last;
    // let moveDir: 'up' | 'down';
    // const smaPrev = smaStack.slice(tiSettings.atrPeriod * -1)[0];
    // if (smaLast > smaPrev + atr / 2) {
    //     moveDir = 'up';
    // } else if (smaLast < smaPrev - atr / 2) {
    //     moveDir = 'down';
    // }
    // console.log(symbol);
    // console.log(moveDir);
    const tdl = (0, indicators_1.TDL)({ candles: _candles, trendsOpt });
    const lvl = (0, indicators_1.LVL)({ candles: _candles, levelsOpt });
    const prePrevCandle = _candles.slice(-3)[0];
    const prevCandle = _candles.slice(-2)[0];
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
        resolvePosition: false,
        atr
    };
    const long = function (stopLoss) {
        if (true /* moveDir == 'up' */) {
            // stopLoss -= atr;
            // if (lastPrice - stopLoss < atr * 2) {
            //     stopLoss = lastPrice - atr * 2;
            // }
            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
            cache[symbol].levelsByDepth.bids = [];
        }
    };
    const short = function (stopLoss) {
        if (true /* moveDir == 'down' */) {
            // stopLoss += atr;
            // if (stopLoss - lastPrice < atr * 2) {
            //     stopLoss = lastPrice + atr * 2;
            // }
            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
            cache[symbol].levelsByDepth.asks = [];
        }
    };
    if (lvl.signal == 'onLevel') {
        console.log('=====================================================================');
        console.log('symbol lvl', symbol, lvl);
        console.log('=====================================================================');
        if (lvl.direction == 'up'
            && lastPrice > lvl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - lvl.topPrice < atr
        // && lastPrice > prevCandle.open
        ) {
            long(lvl.bottomPrice);
        }
        else if (lvl.direction == 'down'
            && lastPrice < lvl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && lvl.bottomPrice - lastPrice < atr
        // && lastPrice < prevCandle.open
        ) {
            short(lvl.topPrice);
        }
    }
    else if (tdl.signal == 'onTrend') {
        console.log('=====================================================================');
        console.log('symbol tld', symbol, tdl);
        console.log('=====================================================================');
        if (tdl.direction == 'up'
            && lastPrice > tdl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - tdl.topPrice < atr
        // && lastPrice > prevCandle.open
        ) {
            long(tdl.bottomPrice);
        }
        else if (tdl.direction == 'down'
            && lastPrice < tdl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && tdl.bottomPrice - lastPrice < atr
        // && lastPrice < prevCandle.open
        ) {
            short(tdl.topPrice);
        }
    }
    else {
        // for (const askLvl of askLevels) {
        //     if (
        //         (
        //             prePrevCandle.low <= askLvl.price
        //             && prePrevCandle.high >= askLvl.price
        //             || prevCandle.low <= askLvl.price
        //             && prevCandle.high >= askLvl.price
        //         )
        //         && lastCandle.close < lastCandle.open
        //         && lastPrice < askLvl.price
        //         && lastCandle.open - lastCandle.close > atr / 3
        //         && askLvl.price - lastPrice < atr
        //         && lastPrice < prevCandle.open
        //         // && depth.bidsSum < depth.asksSum
        //     ) {
        //         short(askLevels.slice(-1)[0].price);
        //         break;
        //     }
        // }
        // for (const bidLvl of bidLevels) {
        //     if (
        //         (
        //             prePrevCandle.low <= bidLvl.price
        //             && prePrevCandle.high >= bidLvl.price
        //             || prevCandle.low <= bidLvl.price
        //             && prevCandle.high >= bidLvl.price
        //         )
        //         && lastCandle.close > lastCandle.open
        //         && lastPrice > bidLvl.price
        //         && lastCandle.close - lastCandle.open > atr / 3
        //         && lastPrice - bidLvl.price < atr
        //         && lastPrice > prevCandle.open
        //         // && depth.bidsSum > depth.asksSum
        //     ) {
        //         long(bidLevels.slice(-1)[0].price);
        //         break;
        //     }
        // }
    }
    if (symbolResult.resolvePosition) {
        console.log(symbolResult);
    }
    return symbolResult;
}
exports.Levels = Levels;
//# sourceMappingURL=levels.js.map