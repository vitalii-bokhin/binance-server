import WebSocket from 'ws';
import { binance, streamApi } from '.';
import { CandlesTicks } from './CandlesTicks';

type Candle = {
    openTime: number;
    high: number;
    open: number;
    close: number;
    low: number;
};

export type CandlesTicksEntry = {
    symbols: string[];
    interval: string;
    limit: number;
};

export type CandlesTicksCallback = (arg0: { [key: string]: Candle[] }) => void;

type SymbolCandlesTicksCallback = (arg0: Candle[]) => void;

type DepthCallback = (arg0: {
    [symbol: string]: {
        bids: string[][];
        asks: string[][];
        lastUpdateId: number;
    }
}) => void;

// check server time
binance.time().then(res => {
    console.log('Server Time: ' + new Date(res.serverTime));
});

const wsStreams: {
    [key: string]: WebSocket;
} = {};

const candlesTicksStreamSubscribers: ((arg0: any) => void)[] = [];

let candlesTicksStreamExecuted = false;

const symbolCandlesTicksStreamSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

export function candlesTicksStream(opt: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    if (callback) {
        candlesTicksStreamSubscribers.push(callback);
    }

    if (!candlesTicksStreamExecuted && opt) {
        const { symbols, interval, limit } = opt;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');

        candlesTicksStreamExecuted = true;

        CandlesTicks({ symbols, interval, limit }, data => {
            const result = data;
            let ws: WebSocket;

            if (wsStreams[streams] !== undefined) {
                ws = wsStreams[streams];
            } else {
                ws = new WebSocket(streamApi + streams);
                wsStreams[streams] = ws;
            }

            ws.on('message', function message(data: any) {
                const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(data).data;
                const { t: openTime, o: open, h: high, l: low, c: close } = ticks;

                const candle: Candle = {
                    openTime: openTime,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close
                };

                if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                    result[symbol].push(candle);
                    result[symbol].shift();
                } else {
                    result[symbol][result[symbol].length - 1] = candle;
                }

                candlesTicksStreamSubscribers.forEach(cb => cb(result));

                if (symbolCandlesTicksStreamSubscribers[symbol]) {
                    symbolCandlesTicksStreamSubscribers[symbol].forEach(cb => cb(result[symbol]));
                }
            });
        });
    }
}

export function symbolCandlesTicksStream(symbol: string, callback: SymbolCandlesTicksCallback, clearSymbolCallback?: boolean) {
    if (symbol && callback) {
        if (!symbolCandlesTicksStreamSubscribers[symbol]) {
            symbolCandlesTicksStreamSubscribers[symbol] = [];
        }

        symbolCandlesTicksStreamSubscribers[symbol].push(callback);
    }

    if (clearSymbolCallback && symbolCandlesTicksStreamSubscribers[symbol]) {
        delete symbolCandlesTicksStreamSubscribers[symbol];
    }
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

// Orders Book
let depthStreamExecuted = false;
const depthStreamSubscribers = [];

export function Depth(symbols: string[], callback: DepthCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        binance.futuresDepth(sym, { limit: 100 }).then(data => {
            result[sym] = data;
            console.log(data.bids.length);

            i++;

            if (i === symbols.length) {
                callback(result);
            }
        }).catch((error: string) => {
            console.log(new Error(error));
        });
    });
}

export function DepthStream(symbols: string[], callback: DepthCallback): void {
    if (callback) {
        depthStreamSubscribers.push(callback);
    }

    if (!depthStreamExecuted) {
        const streams = symbols.map(s => s.toLowerCase() + '@depth@500ms').join('/');

        depthStreamExecuted = true;

        let c = 0;

        Depth(symbols, data => {
            let ws: WebSocket;
            let lastFinalUpdId: number;
            const result: typeof data = Object.assign({}, data);

            // console.log(result['WAVESUSDT'].bids);

            if (wsStreams[streams] !== undefined) {
                ws = wsStreams[streams];
            } else {
                ws = new WebSocket(streamApi + streams);
                wsStreams[streams] = ws;
            }

            ws.on('message', function message(data: any) {
                console.log(c);
                c++;

                const res: {
                    s: string;
                    u: number;
                    pu: number;
                    b: string[][];
                    a: string[][];
                } = JSON.parse(data).data;

                const { s: symbol, b: bids, a: asks, u: finalUpdId, pu: finalUpdIdInLast } = res;

                if (finalUpdId < result[symbol].lastUpdateId) {
                    console.log('ret--------1----------');
                    return;
                }

                if (lastFinalUpdId && finalUpdIdInLast !== lastFinalUpdId) {
                    console.log('ret--------2----------');
                    return;
                } else {
                    lastFinalUpdId = finalUpdId;
                }

                // Bids
                bids.reverse();

                const prelBids: string[][] = [];

                for (const curB of result[symbol].bids) {
                    let isset = false;

                    for (const newB of bids) {
                        if (newB[0] == curB[0]) {
                            if (+newB[1] !== 0) {
                                prelBids.push(newB);
                            }

                            isset = true;
                        }
                    }

                    if (!isset) {
                        prelBids.push(curB);
                    }
                }

                const resultBids: string[][] = [];

                for (let i = 0; i < prelBids.length; i++) {
                    const cBid = prelBids[i];

                    for (const newB of bids) {
                        if (newB[0] !== cBid[0] && +newB[1] !== 0) {
                            if (!i && +newB[0] > +cBid[0]) {
                                resultBids.push(newB);
                            } else if (i && +prelBids[i - 1][0] > +newB[0] && +newB[0] > +cBid[0]) {
                                resultBids.push(newB);
                            }
                        }
                    }

                    resultBids.push(cBid);

                    if (i == prelBids.length - 1) {
                        for (const newB of bids) {
                            if (newB[0] !== cBid[0] && +newB[1] !== 0 && +cBid[0] > +newB[0]) {
                                resultBids.push(newB);
                            }
                        }
                    }
                }

                // Asks
                const prelAsks: string[][] = [];

                for (const curA of result[symbol].asks) {
                    let isset = false;

                    for (const newA of asks) {
                        if (newA[0] == curA[0]) {
                            if (+newA[1] !== 0) {
                                prelAsks.push(newA);
                            }

                            isset = true;
                        }
                    }

                    if (!isset) {
                        prelAsks.push(curA);
                    }
                }

                const resultAsks: string[][] = [];

                for (let i = 0; i < prelAsks.length; i++) {
                    const cAsk = prelAsks[i];

                    for (const newA of asks) {
                        if (newA[0] !== cAsk[0] && +newA[1] !== 0) {
                            if (!i && +newA[0] < +cAsk[0]) {
                                resultAsks.push(newA);
                            } else if (i && +prelAsks[i - 1][0] < +newA[0] && +newA[0] < +cAsk[0]) {
                                resultAsks.push(newA);
                            }

                            if (i == prelAsks.length - 1 && +cAsk[0] < +newA[0]) {
                                resultAsks.push(newA);
                            }
                        }
                    }

                    resultAsks.push(cAsk);

                    if (i == prelAsks.length - 1) {
                        for (const newA of asks) {
                            if (newA[0] !== cAsk[0] && +newA[1] !== 0 && +cAsk[0] < +newA[0]) {
                                resultAsks.push(newA);
                            }
                        }
                    }

                }

                result[symbol].bids = resultBids;
                result[symbol].asks = resultAsks;

                // console.log('asks lng');
                // console.log(result[symbol].asks.length);
                // console.log(result[symbol].asks[0], result[symbol].asks[result[symbol].asks.length - 1]);

                // console.log('bids lng');
                // console.log(result[symbol].bids.length);
                // console.log(result[symbol].bids[0], result[symbol].bids[result[symbol].bids.length - 1]);

                depthStreamSubscribers.forEach(cb => cb(result));
            });
        });
    }
}