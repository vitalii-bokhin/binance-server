import { Candle, InputTime, LevelInput, LevelOpt, LineOpt, TrendlineInput } from './types';

type PrelSignal = 'nextToTop' | 'nextToBottom' | 'crossBelow' | 'crossAbove';

type Signal = 'bounceUp' | 'bounceDown' | 'crossAbove' | 'crossBelow';

const getSignal = function (cdl: Candle, prevCdl: Candle, levelOpt: LevelOpt): PrelSignal {
    const priceOnLine = levelOpt.price;
    const spread = levelOpt.spread;

    let signal: PrelSignal;

    if (cdl.high > priceOnLine - spread && prevCdl.low < priceOnLine - spread) {
        signal = 'nextToBottom';
    } else if (cdl.low < priceOnLine + spread && prevCdl.high > priceOnLine + spread) {
        signal = 'nextToTop';
    }

    if (cdl.high > priceOnLine + spread && prevCdl.low < priceOnLine - spread) {
        signal = 'crossAbove';
    } else if (cdl.low < priceOnLine - spread && prevCdl.high > priceOnLine + spread) {
        signal = 'crossBelow';
    }

    return signal;
}

export function LVL({ symbol, candles, levelOpt }: LevelInput): Signal {
    let signal: Signal;

    const thirdCdl = candles[candles.length - 3];
    const secondCdl = candles[candles.length - 2];
    const curCdl = candles[candles.length - 1];

    const lastSignal = getSignal(secondCdl, thirdCdl, levelOpt);

    if (
        lastSignal == 'nextToBottom' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread
    ) {
        signal = 'bounceDown';
    } else if (
        lastSignal == 'nextToTop' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price + levelOpt.spread
    ) {
        signal = 'bounceUp';
    } else if (
        lastSignal == 'crossBelow' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread
    ) {
        signal = 'crossBelow';
    } else if (
        lastSignal == 'crossAbove' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price + levelOpt.spread
    ) {
        signal = 'crossAbove';
    }

    return signal;
}