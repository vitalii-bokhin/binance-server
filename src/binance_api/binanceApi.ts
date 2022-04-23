import WebSocket from 'ws';
import { binance } from '.';

// check server time
binance.time().then(res => {
    console.log('Server Time: ' + new Date(res.serverTime));
});

export const wsStreams: {
    [key: string]: WebSocket;
} = {};

// account data stream (position, order update)
const orderUpdateSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

const positionUpdateSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

const userFutureDataSubscribers: {
    [key: string]: (arg0: any) => void;
} = {};

let userFutureDataExecuted = false;

const userFutureDataSubscribe = function (key: string, callback: { (order: any): void; (positions: any): void; (arg0: any): void; }) {
    userFutureDataSubscribers[key] = callback;

    if (!userFutureDataExecuted) {
        userFutureDataExecuted = true;

        binance.websockets.userFutureData(
            null,
            (res: { updateData: { positions: any; }; }) => {
                if (userFutureDataSubscribers['positions_update']) {
                    userFutureDataSubscribers['positions_update'](res.updateData.positions);
                }
            },
            (res: { order: any; }) => {
                if (userFutureDataSubscribers['orders_update']) {
                    userFutureDataSubscribers['orders_update'](res.order);
                }
            }
        );
    }
}

export function ordersUpdateStream(symbol?: string, callback?: (arg0: {
    symbol: string;
    clientOrderId: string;
    orderStatus: 'NEW' | 'FILLED';
    averagePrice: string;
    side: any;
    orderType: any;
    timeInForce: any;
    originalQuantity: any;
    originalPrice: any;
    stopPrice: any;
    executionType: any;
    orderId: any;
    orderLastFilledQuantity: any;
    orderFilledAccumulatedQuantity: any;
    lastFilledPrice: any;
    commissionAsset: any;
    commission: any;
    orderTradeTime: any;
    tradeId: any;
    bidsNotional: any;
    askNotional: any;
    isMakerSide: any;
    isReduceOnly: any;
    stopPriceWorkingType: any;
    originalOrderType: any;
    positionSide: any;
    closeAll: any;
    activationPrice: any;
    callbackRate: any;
    realizedProfit: any;
}) => void, clearSymbolCallback?: boolean) {
    if (symbol && callback) {
        if (!orderUpdateSubscribers[symbol]) {
            orderUpdateSubscribers[symbol] = [];
        }

        orderUpdateSubscribers[symbol].push(callback);
    }

    if (!userFutureDataSubscribers['orders_update']) {
        userFutureDataSubscribe('orders_update', function (order: { symbol: string | number; }) {
            if (orderUpdateSubscribers[order.symbol]) {
                orderUpdateSubscribers[order.symbol].forEach(cb => cb(order));
            }
        });
    }

    if (clearSymbolCallback && orderUpdateSubscribers[symbol]) {
        orderUpdateSubscribers[symbol] = [];
    }
}

export function positionUpdateStream(symbol: string, callback: (arg0: {}) => void, clearSymbolCallback?: boolean) {
    if (symbol && callback) {
        if (!positionUpdateSubscribers[symbol]) {
            positionUpdateSubscribers[symbol] = [];
        }

        positionUpdateSubscribers[symbol].push(callback);
    }

    if (!userFutureDataSubscribers['positions_update']) {
        userFutureDataSubscribe('positions_update', function (positions: any[]) {
            positions.forEach((pos: { symbol: string | number; }) => {
                positionUpdateSubscribers[pos.symbol].forEach(cb => cb(pos));
            });
        });
    }

    if (clearSymbolCallback && positionUpdateSubscribers[symbol]) {
        positionUpdateSubscribers[symbol] = [];
    }
}

// price stream
const priceSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

let priceStreamWsHasBeenRun = false;

export function priceStream(symbol: string, callback: (arg0: {
    symbol: string;
    markPrice?: string;
    eventType?: string;
    eventTime?: number;
    indexPrice?: string;
    fundingRate?: string;
    fundingTime?: number;
}) => void, clearSymbolCallback?: boolean) {
    if (symbol && callback) {
        if (!priceSubscribers[symbol]) {
            priceSubscribers[symbol] = [];
        }

        priceSubscribers[symbol].push(callback);
    }

    if (!priceStreamWsHasBeenRun) {
        priceStreamWsHasBeenRun = true;

        binance.futuresMarkPriceStream((res: any[]) => {
            res.forEach((item: { symbol: string | number; }) => {
                if (priceSubscribers[item.symbol]) {
                    priceSubscribers[item.symbol].forEach(cb => cb(item));
                }
            });
        });
    }

    if (clearSymbolCallback && priceSubscribers[symbol]) {
        priceSubscribers[symbol] = [];
    }
}

// ticker stream
const tickerStreamSubscribers: ((arg0: any) => void)[] = [];

let tickerStreamHasBeenRun = false;

const tickerStreamCache: {
    [key: string]: any;
} = {};

export function tickerStream(callback?: (arg0: any) => void): void {
    if (callback) {
        tickerStreamSubscribers.push(callback);
    }

    if (!tickerStreamHasBeenRun) {
        tickerStreamHasBeenRun = true;

        binance.futuresTickerStream(res => {
            tickerStreamSubscribers.forEach(cb => cb(res));
            res.forEach(obj => tickerStreamCache[obj.symbol] = obj);
        });
    }
}

export function getTickerStreamCache(symbol: string): {
    eventType: string;
    eventTime: number;
    symbol: string;
    priceChange: string;
    percentChange: string;
    averagePrice: string;
    close: string;
    closeQty: string;
    open: string;
    high: string;
    low: string;
    volume: string;
    quoteVolume: string;
    openTime: number;
    closeTime: number;
    firstTradeId: number;
    lastTradeId: number;
    numTrades: number;
} {
    return tickerStreamCache[symbol];
}