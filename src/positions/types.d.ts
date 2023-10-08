export interface Position {
    symbol: string;
    direction: 'long' | 'short';
    fee: number;
    entryPrice: number;
    quantity: number;
    usdtAmount: number;
    takeProfit: number;
    stopLoss: number;
    lossUSDT: number;
    averaged: boolean;
    lostUsdtAmount: number;
    profitUsdtAmount: number;
    open: () => Promise<string>;
    setEntryOrders: () => Promise<void>;
    setOutgoingOrders: () => void;
    watch: () => void;
    candleTick: (data: Candle[]) => Promise<void>;
    average: () => void;
    close: (arg0: 'profit' | 'loss') => Promise<void>;
}

export type OpenedPosition = {
    symbol: string;
    entryPrice: number;
    takeProfit: number;
    stopLoss: number;
};