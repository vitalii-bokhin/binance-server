export type KeyResult = {
    key: string;
    expectedProfit: number;
    possibleLoss: number;
    position: 'long' | 'short';
    entryPrice: number;
    stopLoss: number;
}

export type Result = KeyResult[];

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
}

export enum CdlDir {
    up = 'up',
    down = 'down',
}