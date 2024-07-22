export type SymbolCandlesTicksCallback = (arg0: Candle[]) => void;

export type Candle = {
    openTime: number;
    high: number;
    open: number;
    close: number;
    low: number;
    volume: number;
    new: boolean;
};

export type CandlesTicksEntry = {
    symbols: string[];
    interval: string;
    limit: number;
};

export type CandlesTicksCallback = (arg0: { [key: string]: Candle[] }) => void;

export type DepthCallback = (arg0: {
    [symbol: string]: {
        bids: string[][];
        asks: string[][];
        lastUpdateId: number;
    };
}) => void;

export type TradeListData = {
    symbol: string;
    price: number;
    qty: number;
    isBuyerMaker: boolean;
    time: number;
};
