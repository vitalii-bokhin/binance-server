export type SymbolResult = {
    symbol: string;
    position: 'long' | 'short';
    entryPrice: number;
    signal: string;
    signalDetails?: any;
    percentLoss?: number;
    preferIndex?: number;
    takeProfit?: number;
    possibleLoss?: number;
    expectedProfit?: number;
    rsiPeriod?: number;
    resolvePosition: boolean;
};

export type Result = SymbolResult[];

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
    isFinal?: boolean;
};

export type CdlDir = 'up' | 'down';

export type Entry = {
    fee: number;
    data: { [key: string]: Candle[] };
    limit?: number;
};