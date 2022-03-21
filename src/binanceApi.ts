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

export function candlesTicks({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        const ticksArr = [];

        binance.futuresCandles(sym, interval, { limit }).then(ticks => {
            ticks.forEach((tick, i) => {
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
        });
    });
}

export function candlesTicksStream({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    candlesTicks({ symbols, interval, limit }, (data) => {
        const result = data;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');

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
                limit
            };

            if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                result[symbol].push(candle);
            }

            result[symbol][result[symbol].length - 1] = candle;

            callback(result);

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

const userFutureDataSubscribe = function (key, callback) {
    userFutureDataSubscribers[key] = callback;

    if (!userFutureDataExecuted) {
        userFutureDataExecuted = true;

        binanceAuth.websockets.userFutureData(
            null,
            (res) => {
                if (userFutureDataSubscribers['positions_update']) {
                    userFutureDataSubscribers['positions_update'](res.updateData.positions);
                }
            },
            (res) => {
                if (userFutureDataSubscribers['orders_update']) {
                    userFutureDataSubscribers['orders_update'](res.order);
                }
            }
        );
    }
}

export function ordersUpdateStream(symbol: string, callback: (arg0: {}) => void) {
    if (!orderUpdateSubscribers[symbol]) {
        orderUpdateSubscribers[symbol] = [];
    }

    orderUpdateSubscribers[symbol].push(callback);

    userFutureDataSubscribe('orders_update', function (order) {
        orderUpdateSubscribers[order.symbol].forEach(cb => cb(order));
    });
}

export function positionUpdateStream(symbol: string, callback: (arg0: {}) => void) {
    if (!positionUpdateSubscribers[symbol]) {
        positionUpdateSubscribers[symbol] = [];
    }

    positionUpdateSubscribers[symbol].push(callback);

    userFutureDataSubscribe('positions_update', function (positions) {
        positions.forEach(pos => {
            positionUpdateSubscribers[pos.symbol].forEach(cb => cb(pos));
        });
    });
}

// price stream
const priceSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

let priceStreamWsHasBeenRun = false;

export function priceStream(symbol, callback: (arg0: {
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

        binance.futuresMarkPriceStream(res => {
            res.forEach(item => {
                if (priceSubscribers[item.symbol]) {
                    priceSubscribers[item.symbol].forEach(cb => cb(item));
                }
            });
        });
    }
}