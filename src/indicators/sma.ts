import { IndicatorEntry, Result } from './types';
import { SMA as tiSma } from 'technicalindicators';

export function SMA({ data, period }: IndicatorEntry): Result {
    const candles = [...data],
        lastCandle = candles.pop(),
        input = {
            values: candles.map(cdl => cdl.close),
            period
        };
        // inputHigh = {
        //     values: candles.map(cdl => cdl.high),
        //     period
        // },
        // inputLow = {
        //     values: candles.map(cdl => cdl.low),
        //     period
        // }

    const sma = new tiSma(input);
    // const smaH = new tiSma(inputHigh);
    // const smaL = new tiSma(inputLow);

    return {
        stack: sma.getResult(),
        // stackHigh: smaH.getResult(),
        // stackLow: smaL.getResult(),
        last: sma.nextValue(lastCandle.close)
    };
}