import { depthCache } from '../bot';
import { ATR, LVL, SMA, TDL } from '../indicators';
import { Candle, SymbolResult, Entry } from './types';
let i = 0, j = 0;

const cache: {
    [symbol: string]: {
        levelsByDepth: {
            asks: {
                price: number;
                volume: number;
            }[];
            bids: {
                price: number;
                volume: number;
            }[];
        };
    };
} = {};

export function Levels({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }: Entry): SymbolResult {
    if (!cache[symbol]) {
        cache[symbol] = {
            levelsByDepth: {
                asks: [],
                bids: []
            }
        };
    }

    const depth = depthCache[symbol];

    if (depth) {
        if (
            !cache[symbol].levelsByDepth.asks.length
            || cache[symbol].levelsByDepth.asks.slice(-1)[0].price !== depth.maxAsk.price
        ) {
            cache[symbol].levelsByDepth.asks.push({
                price: depth.maxAsk.price,
                volume: depth.maxAsk.volume
            });
        }

        if (
            !cache[symbol].levelsByDepth.bids.length
            || cache[symbol].levelsByDepth.bids.slice(-1)[0].price !== depth.maxBid.price
        ) {
            cache[symbol].levelsByDepth.bids.push({
                price: depth.maxBid.price,
                volume: depth.maxBid.volume
            });
        }
    }

    const askLevels = cache[symbol].levelsByDepth.asks.slice(-3);
    const bidLevels = cache[symbol].levelsByDepth.bids.slice(-3);

    askLevels.sort((a, b) => a.price - b.price);
    bidLevels.sort((a, b) => b.price - a.price);

    // console.log(symbol);
    // console.log('askLevels');
    // console.log(askLevels);
    // console.log('bidLevels');
    // console.log(bidLevels);

    const _candles = candlesData;

    const smaSlow = SMA({ data: _candles, period: tiSettings.smaPeriod }).last;
    const smaQuick = SMA({ data: _candles, period: Math.ceil(tiSettings.smaPeriod / 5) }).last;

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod }).last;

    const tdl = TDL({ candles: _candles, trendsOpt });
    const lvl = LVL({ candles: _candles, levelsOpt });

    const prePrevCandle: Candle = _candles.slice(-3)[0];
    const prevCandle: Candle = _candles.slice(-2)[0];
    const lastCandle: Candle = _candles.slice(-1)[0];

    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'levels',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false
    };

    const long = function (stopLoss) {
        if (smaQuick > smaSlow) {

            if (lastPrice - stopLoss < atr * 2) {
                stopLoss = lastPrice - atr * 2;
            }

            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;

            cache[symbol].levelsByDepth.bids = [];
        }
    }

    const short = function (stopLoss) {
        if (smaQuick < smaSlow) {

            if (stopLoss - lastPrice < atr * 2) {
                stopLoss = lastPrice + atr * 2;
            }

            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.preferIndex = 100 - percentLoss;
            symbolResult.resolvePosition = true;

            cache[symbol].levelsByDepth.asks = [];
        }
    }

    for (const askLvl of askLevels) {
        if (
            (
                prePrevCandle.low <= askLvl.price
                && prePrevCandle.high >= askLvl.price
                || prevCandle.low <= askLvl.price
                && prevCandle.high >= askLvl.price
            )
            && lastCandle.close < lastCandle.open
            && lastPrice < askLvl.price
            && lastCandle.open - lastCandle.close > atr / 3
            && askLvl.price - lastPrice < atr
            // && depth.bidsSum < depth.asksSum
        ) {
            short(askLevels.slice(-1)[0].price);
            break;
        }
    }

    for (const bidLvl of bidLevels) {
        if (
            (
                prePrevCandle.low <= bidLvl.price
                && prePrevCandle.high >= bidLvl.price
                || prevCandle.low <= bidLvl.price
                && prevCandle.high >= bidLvl.price
            )
            && lastCandle.close > lastCandle.open
            && lastPrice > bidLvl.price
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - bidLvl.price < atr
            // && depth.bidsSum > depth.asksSum
        ) {
            long(bidLevels.slice(-1)[0].price);
            break;
        }
    }

    if (lvl.signal == 'onLevel') {
        // console.log(symbol);
        // console.log(lvl);
        // console.log(i++);

        if (
            lvl.direction == 'up'
            && lastPrice > lvl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - tdl.topPrice < atr
        ) {
            long(lvl.bottomPrice);

        } else if (
            lvl.direction == 'down'
            && lastPrice < lvl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && tdl.bottomPrice - lastPrice < atr
        ) {
            short(lvl.topPrice);
        }
    }

    if (tdl.signal == 'onTrend') {
        // console.log(symbol);
        // console.log(tdl);
        // console.log(j++);

        if (
            tdl.direction == 'up'
            && lastPrice > tdl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.close - lastCandle.open > atr / 3
            && lastPrice - tdl.topPrice < atr
        ) {
            long(tdl.bottomPrice);

        } else if (
            tdl.direction == 'down'
            && lastPrice < tdl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.open - lastCandle.close > atr / 3
            && tdl.bottomPrice - lastPrice < atr
        ) {
            short(tdl.topPrice);
        }
    }

    // if (symbolResult.resolvePosition) {
    //     console.log(symbolResult);
    // }

    return symbolResult;
}