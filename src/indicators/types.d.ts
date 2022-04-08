export type Result = {
    last: number;
    stack?: number[];
    avgRsiAbove?: number;
    avgRsiBelow?: number;
    stackHigh?: number[];
    stackLow?: number[];
};

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
    openTime: number;
    closeTime: number;
};

export type IndicatorEntry = {
    data: Candle[];
    period: number;
};

export type InputTime = { d: number; h: number; m: number; };

export type TradelinesInput = {
    candles: Candle[];
    topLineOpt: {
        price: number;
        time: InputTime;
    }[];
    bottomLineOpt: {
        price: number;
        time: InputTime;
    }[];
};

export type TradelinesResult = {
    signal: 'crossAboveTop' | 'crossBelowTop' | 'crossBelowBottom' | 'crossAboveBottom' | 'overTop' | 'overBottom' | 'underTop' | 'underBottom';
    topLinePrice: number;
    bottomLinePrice: number;
};