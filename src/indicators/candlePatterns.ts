import { Candle, IndicatorEntry } from './types';
import { bullishengulfingpattern, bearishengulfingpattern, hammerpattern, hangingman } from 'technicalindicators';

export default function candlePatterns({ data }: IndicatorEntry) {
    const candles = [...data];
    candles.pop();

    return {
        BullishEngulfing: BullishEngulfing(candles),
        BearishEngulfing: BearishEngulfing(candles),
        Hammer: Hammer(candles),
        HangingMan: HangingMan(candles),
    };
}

function BullishEngulfing(candles: Candle[]) {
    const c1: Candle = candles.slice(-2)[0];
    const c2: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1.open, c2.open],
        high: [c1.high, c2.high],
        close: [c1.close, c2.close],
        low: [c1.low, c2.low],
    };

    return bullishengulfingpattern(input);
}

function BearishEngulfing(candles: Candle[]) {
    const c1: Candle = candles.slice(-2)[0];
    const c2: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1.open, c2.open],
        high: [c1.high, c2.high],
        close: [c1.close, c2.close],
        low: [c1.low, c2.low],
    };

    return bearishengulfingpattern(input);
}

function Hammer(candles: Candle[]) {
    const c1: Candle = candles.slice(-5)[0];
    const c2: Candle = candles.slice(-4)[0];
    const c3: Candle = candles.slice(-3)[0];
    const c4: Candle = candles.slice(-2)[0];
    const c5: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3, c4, c5].map(c => c.open),
        high: [c1, c2, c3, c4, c5].map(c => c.high),
        close: [c1, c2, c3, c4, c5].map(c => c.close),
        low: [c1, c2, c3, c4, c5].map(c => c.low),
    };

    return hammerpattern(input);
}

function HangingMan(candles: Candle[]) {
    const c1: Candle = candles.slice(-5)[0];
    const c2: Candle = candles.slice(-4)[0];
    const c3: Candle = candles.slice(-3)[0];
    const c4: Candle = candles.slice(-2)[0];
    const c5: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3, c4, c5].map(c => c.open),
        high: [c1, c2, c3, c4, c5].map(c => c.high),
        close: [c1, c2, c3, c4, c5].map(c => c.close),
        low: [c1, c2, c3, c4, c5].map(c => c.low),
    };

    return hangingman(input);
}