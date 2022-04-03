export type Result = {
    last: number;
    stack: number[];
    stackHigh?: number[];
    stackLow?: number[];
};

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
    isFinal?: boolean;
};

export type IndicatorEntry = {
    data: Candle[];
    period: number;
};