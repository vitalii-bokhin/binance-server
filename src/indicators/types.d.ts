export type Result = {
    last: number;
    stack?: number[];
    avgRsiAbove?: number;
    avgRsiBelow?: number;
    stackHigh?: number[];
    stackLow?: number[];
};

export type Candle = {
    openTime: number;
    high: number;
    open: number;
    close: number;
    low: number;
};

export type IndicatorEntry = {
    data: Candle[];
    period: number;
};

export type InputTime = { d: number; h: number; m: number; };

export type TrendlineInput = {
    candles: Candle[];
    lineOpt: LineOpt;
    symbol: string;
};

export type LevelOpt = {
    id: string;
    price: number[];
};

export type LineOpt = {
    id: string;
    lines: {
        start: {
            price: number;
            time: number;
        };
        end: {
            price: number;
            time: number;
        };
    }[];
};

export type LevelInput = {
    candles: Candle[];
    levelsOpt: LevelOpt[];
};