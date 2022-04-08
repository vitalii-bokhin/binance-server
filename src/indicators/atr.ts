import { IndicatorEntry } from './types';
import { ATR as tiAtr } from 'technicalindicators';

export function ATR({ data, period }: IndicatorEntry): number {
    const candles = [...data],
        lastCandle = candles.pop();

    const input = {
        high: candles.map(cdl => cdl.high),
        low: candles.map(cdl => cdl.low),
        close: candles.map(cdl => cdl.close),
        period
    };

    const atr = new tiAtr(input);

    const last = atr.nextValue({
        high: lastCandle.high,
        low: lastCandle.low,
        close: lastCandle.close
    });

    return last;
}