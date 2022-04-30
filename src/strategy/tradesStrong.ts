import { depthCache, runDepthStream, runTradeListStream, tradeListCache } from '../bot';
import { Candle, SymbolResult, Entry } from './types';

export function TradesStrong({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    runTradeListStream();
    runDepthStream();

    const _candles = candlesData;

    const lastCandle: Candle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
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
    }

    const short = function (stopLoss) {
        if (true) {



            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;

        }
    }

    if (tradeListCache[symbol] && depthCache[symbol]) {
        console.log('TradesStrong');
        console.log(symbol);
        console.log(depthCache[symbol]);

        if (
            // depthCache[symbol].asksSum < depthCache[symbol].bidsSum
            // && tradeListCache[symbol].prevBuyVol > tradeListCache[symbol].prevSellVol
            depthCache[symbol].prevMaxAsk
            && depthCache[symbol].prevMaxBid
            && depthCache[symbol].prevMaxAsk.price < depthCache[symbol].maxAsk.price
            && depthCache[symbol].prevMaxBid.price < depthCache[symbol].maxBid.price
        ) {
            console.log('UP');
        } else if (
            // depthCache[symbol].asksSum > depthCache[symbol].bidsSum
            // && tradeListCache[symbol].prevBuyVol < tradeListCache[symbol].prevSellVol
            depthCache[symbol].prevMaxAsk
            && depthCache[symbol].prevMaxBid
            && depthCache[symbol].prevMaxAsk.price > depthCache[symbol].maxAsk.price
            && depthCache[symbol].prevMaxBid.price > depthCache[symbol].maxBid.price
        ) {
            console.log('DOWN');
        }

        if (
            depthCache[symbol].prevBestAsk
            && depthCache[symbol].prevBestBid
            && depthCache[symbol].prevBestAsk < depthCache[symbol].bestAsk
            && depthCache[symbol].prevBestBid < depthCache[symbol].bestBid
        ) {
            console.log('UP By Best');
        } else if (
            depthCache[symbol].prevBestAsk
            && depthCache[symbol].prevBestBid
            && depthCache[symbol].prevBestAsk > depthCache[symbol].bestAsk
            && depthCache[symbol].prevBestBid > depthCache[symbol].bestBid
        ) {
            console.log('DOWN By Best');
        }

        // console.log(depthCache[symbol].asksSum, depthCache[symbol].bidsSum);
        // console.log(tradeListCache[symbol].prevBuyVol, tradeListCache[symbol].prevSellVol);
    }


    return symbolResult;
}