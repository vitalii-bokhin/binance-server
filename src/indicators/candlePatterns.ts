import { Candle } from '../binance_api/types';
import { IndicatorEntry } from './types';
import { hammerpattern, hangingman, bullishspinningtop, bearishspinningtop, threeblackcrows, threewhitesoldiers } from 'technicalindicators';

export default function candlePatterns({ data }: IndicatorEntry) {
    const candles = [...data];
    candles.pop();

    return {
        BullishEngulfing: BullishEngulfing(candles) ? 2 : 0,
        BearishEngulfing: BearishEngulfing(candles) ? 2 : 0,
        Hammer: Hammer(candles) ? 5 : 0,
        HangingMan: HangingMan(candles) ? 5 : 0,
        BullishSpinningTop: BullishSpinningTop(candles) ? 1 : 0,
        BearishSpinningTop: BearishSpinningTop(candles) ? 1 : 0,
        ThreeWhiteSoldiers: ThreeWhiteSoldiers(candles) ? 3 : 0,
        ThreeBlackCrows: ThreeBlackCrows(candles) ? 3 : 0,
    };
}

function BullishEngulfing(candles: Candle[]) {
    const c1: Candle = candles.slice(-2)[0];
    const c2: Candle = candles.slice(-1)[0];
    
    return (c1.open > c1.close)
        && (c2.open < c2.close)
        && (c2.open <= c1.close)
        && (c2.close > c1.open);
}

function BearishEngulfing(candles: Candle[]) {
    const c1: Candle = candles.slice(-2)[0];
    const c2: Candle = candles.slice(-1)[0];
    
    return (c1.open < c1.close)
        && (c2.open > c2.close)
        && (c2.open >= c1.close)
        && (c2.close < c1.open);
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

function BullishSpinningTop(candles: Candle[]) {
    const c: Candle = candles.slice(-1)[0];
    const input = {
        open: [c.open],
        high: [c.high],
        close: [c.close],
        low: [c.low],
    };

    return c.open < c.close && bullishspinningtop(input);
}

function BearishSpinningTop(candles: Candle[]) {
    const c: Candle = candles.slice(-1)[0];
    const input = {
        open: [c.open],
        high: [c.high],
        close: [c.close],
        low: [c.low],
    };

    return c.open > c.close && bearishspinningtop(input);
}

function ThreeWhiteSoldiers(candles: Candle[]) {
    const c1: Candle = candles.slice(-3)[0];
    const c2: Candle = candles.slice(-2)[0];
    const c3: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3].map(c => c.open),
        high: [c1, c2, c3].map(c => c.high),
        close: [c1, c2, c3].map(c => c.close),
        low: [c1, c2, c3].map(c => c.low),
    };

    return threewhitesoldiers(input);
}

function ThreeBlackCrows(candles: Candle[]) {
    const c1: Candle = candles.slice(-3)[0];
    const c2: Candle = candles.slice(-2)[0];
    const c3: Candle = candles.slice(-1)[0];
    const input = {
        open: [c1, c2, c3].map(c => c.open),
        high: [c1, c2, c3].map(c => c.high),
        close: [c1, c2, c3].map(c => c.close),
        low: [c1, c2, c3].map(c => c.low),
    };

    return threeblackcrows(input);
}
