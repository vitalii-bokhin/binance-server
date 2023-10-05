import { IndicatorEntry, Result } from './types';
import { RSI as tiRsi } from 'technicalindicators';

const cache: {
    [symbol: string]: {
        stack: number[];
        lastCandleOpenTime: number;
    };
} = {};

export function RSI({ data, period, symbol }: { symbol: string } & IndicatorEntry): Result {
    const candles = [...data],
        lastCandle = candles.pop(),
        input = {
            values: candles.map(cdl => cdl.close),
            period
        }

    const rsi = new tiRsi(input);

    const stack = cache[symbol] ? cache[symbol].stack : rsi.getResult();

    const last = rsi.nextValue(lastCandle.close);

    const result: Result = {
        stack,
        last,
        avgRsiAbove: 0,
        avgRsiBelow: 0
    };

    let rsiAbove = [];
    let rsiBelow = [];

    result.stack.forEach(el => {
        if (el > 60) {
            rsiAbove.push(el);
        } else if (el < 40) {
            rsiBelow.push(el);
        }
    });

    result.avgRsiAbove = rsiAbove.reduce((p, c) => p + c, 0) / rsiAbove.length || 60;
    result.avgRsiBelow = rsiBelow.reduce((p, c) => p + c, 0) / rsiBelow.length || 40;

    if (!cache[symbol]) {
        cache[symbol] = {
            stack: stack,
            lastCandleOpenTime: lastCandle.openTime
        };
    } else if (lastCandle.openTime !== cache[symbol].lastCandleOpenTime) {
        cache[symbol].lastCandleOpenTime = lastCandle.openTime;
        cache[symbol].stack.push(last);
    }

    return result;
}