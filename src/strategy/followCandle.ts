import { heikinashi } from 'technicalindicators';
import { depthCache } from '../bot';
import { ATR, LVL, SMA, TDL } from '../indicators';
import { Candle, SymbolResult, Entry } from './types';

const cache: {
    [symbol: string]: {
        lastOpenTime: number;
    };
} = {};

export function FollowCandle({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    const _candles = candlesData;

    const haCandles = _candles.slice(-14, -1);

    const haData = {
        open: haCandles.map(c => c.open),
        close: haCandles.map(c => c.close),
        high: haCandles.map(c => c.high),
        low: haCandles.map(c => c.low)
    };

    const ha = heikinashi(haData);

    const prevCandleHa: Candle = {
        high: ha.high.slice(-1)[0],
        open: ha.open.slice(-1)[0],
        close: ha.close.slice(-1)[0],
        low: ha.low.slice(-1)[0],
        openTime: null
    };

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod }).last;

    const lastCandle: Candle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'follow_candle',
        preferIndex: atr / (lastPrice / 100),
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false,
        atr
    };

    if (!cache[symbol]) {
        cache[symbol] = {
            lastOpenTime: lastCandle.openTime
        };
    }

    const long = function (stopLoss) {
        if (cache[symbol].lastOpenTime !== lastCandle.openTime) {

            // stopLoss -= atr;

            if (lastPrice - stopLoss < atr) {
                stopLoss = lastPrice - atr;
            }

            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;

            cache[symbol].lastOpenTime = lastCandle.openTime;
        }
    }

    const short = function (stopLoss) {
        if (cache[symbol].lastOpenTime !== lastCandle.openTime) {

            // stopLoss += atr;

            if (stopLoss - lastPrice < atr) {
                stopLoss = lastPrice + atr;
            }

            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;

            cache[symbol].lastOpenTime = lastCandle.openTime;
        }
    }

    // console.log(symbol, prevCandleHa);

    if (prevCandleHa.close > prevCandleHa.open) {
        if (
            prevCandleHa.open <= prevCandleHa.low
            && lastCandle.close - lastCandle.open > atr / 5
        ) {
            // console.log(symbol, 'long');
            long(prevCandleHa.open);
        }

    } else if (prevCandleHa.close < prevCandleHa.open) {
        if (
            prevCandleHa.open >= prevCandleHa.high
            && lastCandle.open - lastCandle.close > atr / 5
        ) {
            // console.log(symbol, 'short');
            short(prevCandleHa.open);
        }
    }

    

    return symbolResult;
}