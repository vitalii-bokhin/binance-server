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

export type LineOpt = {
    start: {
        price: number;
        time: InputTime;
    };
    end: {
        price: number;
        time: InputTime;
    };
    spread: number;  
};

export type TrendlineInput = {
    candles: Candle[];
    lineOpt: LineOpt;
    symbol: string;
};

export type LevelOpt = {
    price: number;
    spread: number;  
};

export type LevelInput = {
    candles: Candle[];
    levelOpt: LevelOpt;
    symbol: string;
};