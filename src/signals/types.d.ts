export type SymbolResult = {
    symbol: string;
    position: 'long' | 'short';
    entryPrice: number;
    signal: string;
    stopLoss?: number;
    possibleLoss?: number;
    expectedProfit?: number;
    preferIndex: number;
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
    limit: number;
    data: { [key: string]: Candle[] };
};