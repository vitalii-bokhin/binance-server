"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesStrong = void 0;
const bot_1 = require("../bot");
function TradesStrong({ symbol, candlesData, tiSettings }) {
    (0, bot_1.runTradeListStream)();
    (0, bot_1.runDepthStream)();
    const _candles = candlesData;
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
    if (bot_1.tradeListCache[symbol] && bot_1.depthCache[symbol]) {
        console.log('TradesStrong');
        console.log(symbol);
        console.log(bot_1.depthCache[symbol]);
        if (
        // depthCache[symbol].asksSum < depthCache[symbol].bidsSum
        // && tradeListCache[symbol].prevBuyVol > tradeListCache[symbol].prevSellVol
        bot_1.depthCache[symbol].prevMaxAsk
            && bot_1.depthCache[symbol].prevMaxBid
            && bot_1.depthCache[symbol].prevMaxAsk.price < bot_1.depthCache[symbol].maxAsk.price
            && bot_1.depthCache[symbol].prevMaxBid.price < bot_1.depthCache[symbol].maxBid.price) {
            console.log('UP');
        }
        else if (
        // depthCache[symbol].asksSum > depthCache[symbol].bidsSum
        // && tradeListCache[symbol].prevBuyVol < tradeListCache[symbol].prevSellVol
        bot_1.depthCache[symbol].prevMaxAsk
            && bot_1.depthCache[symbol].prevMaxBid
            && bot_1.depthCache[symbol].prevMaxAsk.price > bot_1.depthCache[symbol].maxAsk.price
            && bot_1.depthCache[symbol].prevMaxBid.price > bot_1.depthCache[symbol].maxBid.price) {
            console.log('DOWN');
        }
        if (bot_1.depthCache[symbol].prevBestAsk
            && bot_1.depthCache[symbol].prevBestBid
            && bot_1.depthCache[symbol].prevBestAsk < bot_1.depthCache[symbol].bestAsk
            && bot_1.depthCache[symbol].prevBestBid < bot_1.depthCache[symbol].bestBid) {
            console.log('UP By Best');
        }
        else if (bot_1.depthCache[symbol].prevBestAsk
            && bot_1.depthCache[symbol].prevBestBid
            && bot_1.depthCache[symbol].prevBestAsk > bot_1.depthCache[symbol].bestAsk
            && bot_1.depthCache[symbol].prevBestBid > bot_1.depthCache[symbol].bestBid) {
            console.log('DOWN By Best');
        }
        // console.log(depthCache[symbol].asksSum, depthCache[symbol].bidsSum);
        // console.log(tradeListCache[symbol].prevBuyVol, tradeListCache[symbol].prevSellVol);
    }
    return symbolResult;
}
exports.TradesStrong = TradesStrong;
//# sourceMappingURL=tradesStrong.js.map