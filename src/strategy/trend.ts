import { CheckCandle } from '../indicators/candle';
import { Candle, SymbolResult, Entry } from './types';

const cache: {
    [symbol: string]: {
        startPrice: number;
    };
} = {};

export function Trend({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    if (!cache[symbol]) {
        cache[symbol] = {
            startPrice: null
        };
    }

    const _candles = candlesData;
    const lastCandle: Candle = _candles.slice(-1)[0];
    const lastPrice = lastCandle.close;

    if (cache[symbol].startPrice === null) {
        cache[symbol].startPrice = lastPrice;
    }

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'trend',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: null
    };

    const long = function (stopLoss) {
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;

        if (
            lastCandle.close > lastCandle.open
            && CheckCandle(lastCandle) != 'hasTails'
        ) {
            symbolResult.resolvePosition = true;
        }
    }

    const short = function (stopLoss) {
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;

        if (
            lastCandle.close < lastCandle.open
            && CheckCandle(lastCandle) != 'hasTails'
        ) {
            symbolResult.resolvePosition = true;
        }
    }

    const changePercent = (lastPrice - cache[symbol].startPrice) / (cache[symbol].startPrice / 100);

    if (Math.abs(changePercent) > .3) {
        if (changePercent > 0) {
            long(lastCandle.low);
        } else {
            short(lastCandle.high);
        }

        cache[symbol].startPrice = null;
    }

    return symbolResult;
}