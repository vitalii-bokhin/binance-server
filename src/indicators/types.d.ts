export type Result = {
    stack: number[];
    last: number;
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
    lng: number;
};