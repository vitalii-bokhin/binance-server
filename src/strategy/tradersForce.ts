import { depthCache, runDepthStream, runTradeListStream, tradeListCache } from '../bot';
import { ATR, SMA } from '../indicators';
import { Candle, SymbolResult, Entry } from './types';

const cache: {
    [symbol: string]: {
        upCount: number;
        downCount: number;
        dir: string;
    };
} = {};

export function TradersForce({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    // runTradeListStream();
    runDepthStream();

    if (!cache[symbol]) {
        cache[symbol] = {
            upCount: 0,
            downCount: 0,
            dir: null
        };
    }

    const _candles = candlesData;

    const sma = SMA({ data: _candles, period: tiSettings.smaPeriod }).last;
    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod }).last;

    const prevCandle: Candle = _candles.slice(-2)[0];
    const lastCandle: Candle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'traders_force',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false
    };

    const long = function (stopLoss) {
        if (true/* prevCandle.close > sma && prevCandle.open > sma && lastPrice > sma */) {
            if (lastPrice - stopLoss < atr) {
                stopLoss = lastPrice - atr;
            }

            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    }

    const short = function (stopLoss) {
        if (true/* prevCandle.close < sma && prevCandle.open < sma && lastPrice < sma */) {
            if (stopLoss - lastPrice < atr) {
                stopLoss = lastPrice + atr;
            }

            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;
        }
    }

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

    if (
        depthCache[symbol]
        && depthCache[symbol].maxAsk.price
        && depthCache[symbol].prevMaxAsk.price
        && depthCache[symbol].maxBid.price
        && depthCache[symbol].prevMaxBid.price
    ) {
        // const maxAsksAvg = (depthCache[symbol].maxAsk.price + depthCache[symbol].prevMaxAsk.price) / 2;
        // const maxBidsAvg = (depthCache[symbol].maxBid.price + depthCache[symbol].prevMaxBid.price) / 2;

        if (
            depthCache[symbol].maxBid.price > depthCache[symbol].prevMaxBid.price
            && depthCache[symbol].maxAsk.price - lastPrice > (lastPrice - depthCache[symbol].maxBid.price) * 2
            && depthCache[symbol].asksSum < depthCache[symbol].bidsSum
        ) {
            // console.log(symbol);
            // console.log(`=${symbol}=UP=`);

            cache[symbol].upCount++;

            if (true/* cache[symbol].upCount > 2 && cache[symbol].upCount > cache[symbol].downCount */) {
                long(depthCache[symbol].prevMaxBid.price);
                cache[symbol].upCount = 0;
                cache[symbol].downCount = 0;
                console.log(`=---${symbol}------LONG--------=`);
                console.log('ASK max, sum');
                console.log(symbol, depthCache[symbol].maxAsk, depthCache[symbol].asksSum);
                console.log('BID max, sum');
                console.log(symbol, depthCache[symbol].maxBid, depthCache[symbol].bidsSum);
            }

        } else if (
            depthCache[symbol].maxAsk.price < depthCache[symbol].prevMaxAsk.price
            && (depthCache[symbol].maxAsk.price - lastPrice) * 2 < lastPrice - depthCache[symbol].maxBid.price
            && depthCache[symbol].asksSum > depthCache[symbol].bidsSum
        ) {
            // console.log(symbol);
            // console.log(`=${symbol}=DOWN=`);
            cache[symbol].downCount++;

            if (true/* cache[symbol].downCount > 2 && cache[symbol].upCount < cache[symbol].downCount */) {
                short(depthCache[symbol].prevMaxAsk.price);
                cache[symbol].upCount = 0;
                cache[symbol].downCount = 0;
                console.log(`=---${symbol}------SHORT--------=`);
                console.log('ASK max, sum');
                console.log(symbol, depthCache[symbol].maxAsk, depthCache[symbol].asksSum);
                console.log('BID max, sum');
                console.log(symbol, depthCache[symbol].maxBid, depthCache[symbol].bidsSum);
            }
        }
    }


    return symbolResult;
}