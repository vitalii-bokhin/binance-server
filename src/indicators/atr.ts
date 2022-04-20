import { IndicatorEntry } from './types';
import { ATR as tiAtr } from 'technicalindicators';

export function ATR({ data, period }: IndicatorEntry): {last: number; spreadPercent: number;} {
    const candles = [...data],
        lastCandle = candles.pop();

    const input = {
        high: candles.map(cdl => cdl.high),
        low: candles.map(cdl => cdl.low),
        close: candles.map(cdl => cdl.close),
        period
    };

    const atr = new tiAtr(input);

    const result = atr.getResult().slice(period * -1);

    result.sort((a: number, b: number) => a - b);

    const spreadPercent = (result.slice(-1)[0] - result[0]) / (result[0] / 100);

    const last = atr.nextValue({
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
    });

    return {
        last: +last.toFixed(5),
        spreadPercent
    };
}