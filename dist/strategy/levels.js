"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Levels = void 0;
const bot_1 = require("../bot");
const indicators_1 = require("../indicators");
const cache = {};
function Levels({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }) {
    (0, bot_1.runDepthStream)();
    if (!cache[symbol]) {
        cache[symbol] = {
            levelsByDepth: new Set()
        };
    }
    const depth = bot_1.depthCache[symbol];
    if (depth) {
        if (bot_1.depthCache[symbol].prevMaxAsk.price) {
            cache[symbol].levelsByDepth.add(bot_1.depthCache[symbol].prevMaxAsk.price);
        }
        if (bot_1.depthCache[symbol].prevMaxBid.price) {
            cache[symbol].levelsByDepth.add(bot_1.depthCache[symbol].prevMaxBid.price);
        }
        cache[symbol].levelsByDepth.add(bot_1.depthCache[symbol].maxAsk.price);
        cache[symbol].levelsByDepth.add(bot_1.depthCache[symbol].maxBid.price);
    }
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
    // const tdl = TDL({ candles: _candles, trendsOpt });
    // const lvl = LVL({ candles: _candles, levelsOpt });
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
        signal: 'depthLevels',
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
            cache[symbol].levelsByDepth.clear();
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
            cache[symbol].levelsByDepth.clear();
        }
    };
    /* if (lvl.signal == 'onLevel') {
        console.log('=====================================================================');
        console.log('symbol lvl', symbol, lvl);
        console.log('=====================================================================');

        if (
            lvl.direction == 'up'
            && lastPrice > lvl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - lvl.topPrice < atr
            // && lastPrice > prevCandle.open
        ) {
            long(lvl.bottomPrice);

        } else if (
            lvl.direction == 'down'
            && lastPrice < lvl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && lvl.bottomPrice - lastPrice < atr
            // && lastPrice < prevCandle.open
        ) {
            short(lvl.topPrice);
        }

    } else if (tdl.signal == 'onTrend') {
        console.log('=====================================================================');
        console.log('symbol tld', symbol, tdl);
        console.log('=====================================================================');

        if (
            tdl.direction == 'up'
            && lastPrice > tdl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - tdl.topPrice < atr
            // && lastPrice > prevCandle.open
        ) {
            long(tdl.bottomPrice);

        } else if (
            tdl.direction == 'down'
            && lastPrice < tdl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && tdl.bottomPrice - lastPrice < atr
            // && lastPrice < prevCandle.open
        ) {
            short(tdl.topPrice);
        }

    } else { */
    for (const lvl of cache[symbol].levelsByDepth) {
        let nearLvl = null;
        let dt = 99999;
        if (Math.abs(lastPrice - lvl) < dt) {
            nearLvl = lvl;
            dt = Math.abs(lastPrice - lvl);
        }
        if (prePrevCandle.close < prePrevCandle.open
            && prevCandle.low <= nearLvl
            && prePrevCandle.high > nearLvl
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice > nearLvl
            && lastPrice - nearLvl < atr) {
            long(lastCandle.low < prevCandle.low ? lastCandle.low : prevCandle.low);
        }
        else if (prePrevCandle.close > prePrevCandle.open
            && prevCandle.high >= nearLvl
            && prePrevCandle.low < nearLvl
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && lastPrice < nearLvl
            && nearLvl - lastPrice < atr) {
            short(lastCandle.high > prevCandle.high ? lastCandle.high : prevCandle.high);
        }
    }
    /*}  */
    if (symbolResult.resolvePosition) {
        console.log(symbolResult);
    }
    return symbolResult;
}
exports.Levels = Levels;
//# sourceMappingURL=levels.js.map