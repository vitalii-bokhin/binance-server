"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradersStrong = void 0;
const bot_1 = require("../bot");
const indicators_1 = require("../indicators");
const cache = {};
function TradersStrong({ symbol, candlesData, tiSettings }) {
    // runTradeListStream();
    (0, bot_1.runDepthStream)();
    if (!cache[symbol]) {
        cache[symbol] = {
            upCount: 0,
            downCount: 0,
            dir: null
        };
    }
    const _candles = candlesData;
    const atr = (0, indicators_1.ATR)({ data: _candles, period: tiSettings.atrPeriod }).last;
    const lastCandle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;
    const symbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'traders_strong',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false
    };
    const long = function (stopLoss) {
        if (true) {
            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    };
    const short = function (stopLoss) {
        if (true) {
            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    };
    // if (tradeListCache[symbol] && depthCache[symbol]) {
    //     console.log('TradesStrong');
    //     console.log(symbol);
    //     console.log(depthCache[symbol]);
    //     if (
    //         // depthCache[symbol].asksSum < depthCache[symbol].bidsSum
    //         // && tradeListCache[symbol].prevBuyVol > tradeListCache[symbol].prevSellVol
    //         depthCache[symbol].prevMaxAsk
    //         && depthCache[symbol].prevMaxBid
    //         && depthCache[symbol].prevMaxAsk.price < depthCache[symbol].maxAsk.price
    //         && depthCache[symbol].prevMaxBid.price < depthCache[symbol].maxBid.price
    //     ) {
    //         console.log('UP');
    //     } else if (
    //         // depthCache[symbol].asksSum > depthCache[symbol].bidsSum
    //         // && tradeListCache[symbol].prevBuyVol < tradeListCache[symbol].prevSellVol
    //         depthCache[symbol].prevMaxAsk
    //         && depthCache[symbol].prevMaxBid
    //         && depthCache[symbol].prevMaxAsk.price > depthCache[symbol].maxAsk.price
    //         && depthCache[symbol].prevMaxBid.price > depthCache[symbol].maxBid.price
    //     ) {
    //         console.log('DOWN');
    //     }
    //     if (
    //         depthCache[symbol].prevBestAsk
    //         && depthCache[symbol].prevBestBid
    //         && depthCache[symbol].prevBestAsk < depthCache[symbol].bestAsk
    //         && depthCache[symbol].prevBestBid < depthCache[symbol].bestBid
    //     ) {
    //         console.log('UP By Best');
    //         cache[symbol].upCount++;
    //     } else if (
    //         depthCache[symbol].prevBestAsk
    //         && depthCache[symbol].prevBestBid
    //         && depthCache[symbol].prevBestAsk > depthCache[symbol].bestAsk
    //         && depthCache[symbol].prevBestBid > depthCache[symbol].bestBid
    //     ) {
    //         console.log('DOWN By Best');
    //         cache[symbol].downCount++;
    //     }
    //     if (cache[symbol].upCount > 24 || cache[symbol].downCount > 24) {
    //         if (cache[symbol].upCount > cache[symbol].downCount) {
    //             console.log('====UP====');
    //             cache[symbol].dir = 'UP';
    //         } else {
    //             console.log('====DOWN====');
    //             cache[symbol].dir = 'DOWN';
    //         }
    //         cache[symbol].upCount = 0;
    //         cache[symbol].downCount = 0;
    //     }
    //     console.log('DIR', cache[symbol].dir);
    //     // console.log(depthCache[symbol].asksSum, depthCache[symbol].bidsSum);
    //     // console.log(tradeListCache[symbol].prevBuyVol, tradeListCache[symbol].prevSellVol);
    // }
    if (bot_1.depthCache[symbol]) {
        console.log('ASK');
        console.log(bot_1.depthCache[symbol].maxAsk);
        console.log('l price');
        console.log(lastPrice);
        console.log('BID');
        console.log(bot_1.depthCache[symbol].maxBid);
        if ((bot_1.depthCache[symbol].maxAsk.price - lastPrice) * 2 < lastPrice - bot_1.depthCache[symbol].maxBid.price) {
            console.log('DOWN');
        }
        else if (bot_1.depthCache[symbol].maxAsk.price - lastPrice > (lastPrice - bot_1.depthCache[symbol].maxBid.price) * 2) {
            console.log('UP');
        }
    }
    return symbolResult;
}
exports.TradersStrong = TradersStrong;
//# sourceMappingURL=tradersStrong.js.map