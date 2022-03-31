import { Candle, IndicatorEntry, Result } from './types';
import { RSI as tiRsi } from 'technicalindicators';

export function RSI({ data, lng }: IndicatorEntry): Result {
    const candles = [...data],
        lastCandle = candles.pop(),
        inputRSI = {
            values: candles.map(cdl => cdl.close),
            period: lng
        }

    const rsi = new tiRsi(inputRSI).nextValue(lastCandle.close);

    return rsi;
}