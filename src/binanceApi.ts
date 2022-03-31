import WebSocket from 'ws';
import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';

const binance = new Binance();
const binanceAuth: Binance = new Binance().options({
    APIKEY: BINANCE_KEY,
    APISECRET: BINANCE_SECRET,
    useServerTime: true
});

const streamApi = 'wss://fstream.binance.com/stream?streams=';

type Candle = {
    openTime: number;
    high: number;
    open: number;
    close: number;
    low: number;
    interval: string;
    limit: number;
    isFinal?: boolean;
};

type CandlesTicksEntry = {
    symbols: string[];
    interval: string;
    limit: number;
};

type CandlesTicksCallback = (arg0: { [key: string]: Candle[] }) => void;

const streamsSubscribers: {
    [key: string]: WebSocket;
} = {};

const candlesTicksStreamSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

export function candlesTicks({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        const ticksArr = [];

        binance.futuresCandles(sym, interval, { limit }).then((ticks: any[]) => {
            ticks.forEach((tick: [any, any, any, any, any, any, any, any, any, any, any, any], i: string | number) => {
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;

                ticksArr[i] = {
                    openTime: time,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close
                };
            });

            result[sym] = ticksArr;

            i++;

            if (i === symbols.length) {
                callback(result);
            }

        }).catch((error: string) => {
            console.log(new Error(error));
        });
    });
}

export function candlesTicksStream({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');

    if (!candlesTicksStreamSubscribers[streams]) {
        candlesTicksStreamSubscribers[streams] = [];
    }

    candlesTicksStreamSubscribers[streams].push(callback);

    if (candlesTicksStreamSubscribers[streams].length > 1) {
        return;
    }

    candlesTicks({ symbols, interval, limit }, data => {
        const result = data;
        let ws: WebSocket;

        if (streamsSubscribers[streams] !== undefined) {
            ws = streamsSubscribers[streams];
        } else {
            ws = new WebSocket(streamApi + streams);
            streamsSubscribers[streams] = ws;
        }

        ws.on('message', function message(data: any) {
            const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(data).data;
            const { t: openTime, o: open, h: high, l: low, c: close, x: isFinal } = ticks;

            const candle: Candle = {
                openTime: openTime,
                open: +open,
                high: +high,
                low: +low,
                close: +close,
                interval,
                limit,
                isFinal
            };

            if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                result[symbol].push(candle);
            }

            result[symbol][result[symbol].length - 1] = candle;

            candlesTicksStreamSubscribers[streams].forEach(cb => cb(result));

            if (isFinal) {
                result[symbol].shift();
            }
        });
    });
}

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

        binanceAuth.websockets.userFutureData(
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
}) => void) {
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
}

export function positionUpdateStream(symbol: string, callback: (arg0: {}) => void) {
    if (!positionUpdateSubscribers[symbol]) {
        positionUpdateSubscribers[symbol] = [];
    }

    positionUpdateSubscribers[symbol].push(callback);

    if (!userFutureDataSubscribers['positions_update']) {
        userFutureDataSubscribe('positions_update', function (positions: any[]) {
            positions.forEach((pos: { symbol: string | number; }) => {
                positionUpdateSubscribers[pos.symbol].forEach(cb => cb(pos));
            });
        });
    }
}

// price stream
const priceSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

let priceStreamWsHasBeenRun = false;

export function priceStream(symbol: string, callback: (arg0: {
    symbol: string;
    markPrice: string;
    eventType?: string;
    eventTime?: number;
    indexPrice?: string;
    fundingRate?: string;
    fundingTime?: number;
}) => void) {
    if (!priceSubscribers[symbol]) {
        priceSubscribers[symbol] = [];
    }

    priceSubscribers[symbol].push(callback);

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
}