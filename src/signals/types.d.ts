export type SymbolResult = {
    symbol: string;
    position: 'long' | 'short';
    entryPrice: number;
    signal: string;
    percentLoss?: number;
    preferIndex?: number;
    takeProfit?: number;
    possibleLoss?: number;
    expectedProfit?: number;
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

export type SignalEntry = {
    fee: number;
    data: { [key: string]: Candle[] };
    rsiPeriod?: number;
    limit?: number;
};