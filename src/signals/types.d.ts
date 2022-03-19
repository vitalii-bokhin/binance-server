export type SymbolResult = {
    symbol: string;
    expectedProfit: number;
    possibleLoss: number;
    position: 'long' | 'short';
    entryPrice: number;
    stopLoss: number;
};

export type Result = SymbolResult[];

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
};

export type CdlDir = 'up' | 'down';

export type SignalEntry = {
    fee: number;
    limit: number;
    data: { [key: string]: Candle[] };
};