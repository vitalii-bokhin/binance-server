import { IndicatorEntry, Result } from './types';
import { RSI as tiRsi } from 'technicalindicators';

export function RSI({ data, period }: IndicatorEntry): Result {
    const candles = [...data],
        lastCandle = candles.pop(),
        input = {
            values: candles.map(cdl => cdl.close),
            period
        }

    const rsi = new tiRsi(input);

    return {
        stack: rsi.getResult(),
        last: rsi.nextValue(lastCandle.close)
    };
}