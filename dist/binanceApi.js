"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTickerStreamCache = exports.tickerStream = exports.priceStream = exports.positionUpdateStream = exports.ordersUpdateStream = exports.symbolCandlesTicksStream = exports.candlesTicksStream = exports.candlesTicks = void 0;
const ws_1 = __importDefault(require("ws"));
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("./config");
const binance = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
const streamApi = 'wss://fstream.binance.com/stream?streams=';
// check server time
binance.time().then(res => {
    console.log('Server Time: ' + new Date(res.serverTime));
});
const streamsSubscribers = {};
const candlesTicksStreamSubscribers = {};
let candlesTicksStreamExecuted = false;
const symbolCandlesTicksStreamSubscribers = {};
function candlesTicks({ symbols, interval, limit }, callback) {
    const result = {};
    let i = 0;
    symbols.forEach(sym => {
        const ticksArr = [];
        binance.futuresCandles(sym, interval, { limit }).then((ticks) => {
            ticks.forEach((tick, i) => {
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                ticksArr[i] = {
                    openTime: time,
                    closeTime,
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
        }).catch((error) => {
            console.log(new Error(error));
        });
    });
}
exports.candlesTicks = candlesTicks;
function candlesTicksStream({ symbols, interval, limit }, callback) {
    const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');
    if (!candlesTicksStreamSubscribers[streams]) {
        candlesTicksStreamSubscribers[streams] = [];
    }
    candlesTicksStreamSubscribers[streams].push(callback);
    if (!candlesTicksStreamExecuted) {
        candlesTicksStreamExecuted = true;
        candlesTicks({ symbols, interval, limit }, data => {
            const result = data;
            let ws;
            if (streamsSubscribers[streams] !== undefined) {
                ws = streamsSubscribers[streams];
            }
            else {
                ws = new ws_1.default(streamApi + streams);
                streamsSubscribers[streams] = ws;
            }
            ws.on('message', function message(data) {
                const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(data).data;
                const { t: openTime, T: closeTime, o: open, h: high, l: low, c: close, x: isFinal } = ticks;
                const candle = {
                    openTime: openTime,
                    closeTime,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close,
                    interval,
                    limit
                };
                if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                    result[symbol].push(candle);
                    result[symbol].shift();
                }
                else {
                    result[symbol][result[symbol].length - 1] = candle;
                }
                candlesTicksStreamSubscribers[streams].forEach(cb => cb(result));
                if (symbolCandlesTicksStreamSubscribers[symbol]) {
                    symbolCandlesTicksStreamSubscribers[symbol].forEach(cb => cb(result[symbol]));
                }
            });
        });
    }
}
exports.candlesTicksStream = candlesTicksStream;
function symbolCandlesTicksStream(symbol, callback, clearSymbolCallback) {
    if (symbol && callback) {
        if (!symbolCandlesTicksStreamSubscribers[symbol]) {
            symbolCandlesTicksStreamSubscribers[symbol] = [];
        }
        symbolCandlesTicksStreamSubscribers[symbol].push(callback);
    }
    if (clearSymbolCallback && symbolCandlesTicksStreamSubscribers[symbol]) {
        delete symbolCandlesTicksStreamSubscribers[symbol];
    }
    console.log(symbolCandlesTicksStreamSubscribers);
}
exports.symbolCandlesTicksStream = symbolCandlesTicksStream;
// account data stream (position, order update)
const orderUpdateSubscribers = {};
const positionUpdateSubscribers = {};
const userFutureDataSubscribers = {};
let userFutureDataExecuted = false;
const userFutureDataSubscribe = function (key, callback) {
    userFutureDataSubscribers[key] = callback;
    if (!userFutureDataExecuted) {
        userFutureDataExecuted = true;
        binance.websockets.userFutureData(null, (res) => {
            if (userFutureDataSubscribers['positions_update']) {
                userFutureDataSubscribers['positions_update'](res.updateData.positions);
            }
        }, (res) => {
            if (userFutureDataSubscribers['orders_update']) {
                userFutureDataSubscribers['orders_update'](res.order);
            }
        });
    }
};
function ordersUpdateStream(symbol, callback, clearSymbolCallback) {
    if (symbol && callback) {
        if (!orderUpdateSubscribers[symbol]) {
            orderUpdateSubscribers[symbol] = [];
        }
        orderUpdateSubscribers[symbol].push(callback);
    }
    if (!userFutureDataSubscribers['orders_update']) {
        userFutureDataSubscribe('orders_update', function (order) {
            if (orderUpdateSubscribers[order.symbol]) {
                orderUpdateSubscribers[order.symbol].forEach(cb => cb(order));
            }
        });
    }
    if (clearSymbolCallback && orderUpdateSubscribers[symbol]) {
        orderUpdateSubscribers[symbol] = [];
    }
}
exports.ordersUpdateStream = ordersUpdateStream;
function positionUpdateStream(symbol, callback, clearSymbolCallback) {
    if (symbol && callback) {
        if (!positionUpdateSubscribers[symbol]) {
            positionUpdateSubscribers[symbol] = [];
        }
        positionUpdateSubscribers[symbol].push(callback);
    }
    if (!userFutureDataSubscribers['positions_update']) {
        userFutureDataSubscribe('positions_update', function (positions) {
            positions.forEach((pos) => {
                positionUpdateSubscribers[pos.symbol].forEach(cb => cb(pos));
            });
        });
    }
    if (clearSymbolCallback && positionUpdateSubscribers[symbol]) {
        positionUpdateSubscribers[symbol] = [];
    }
}
exports.positionUpdateStream = positionUpdateStream;
// price stream
const priceSubscribers = {};
let priceStreamWsHasBeenRun = false;
function priceStream(symbol, callback, clearSymbolCallback) {
    if (symbol && callback) {
        if (!priceSubscribers[symbol]) {
            priceSubscribers[symbol] = [];
        }
        priceSubscribers[symbol].push(callback);
    }
    if (!priceStreamWsHasBeenRun) {
        priceStreamWsHasBeenRun = true;
        binance.futuresMarkPriceStream((res) => {
            res.forEach((item) => {
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
exports.priceStream = priceStream;
// ticker stream
const tickerStreamSubscribers = [];
let tickerStreamHasBeenRun = false;
const tickerStreamCache = {};
function tickerStream(callback) {
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
exports.tickerStream = tickerStream;
function getTickerStreamCache(symbol) {
    return tickerStreamCache[symbol];
}
exports.getTickerStreamCache = getTickerStreamCache;
//# sourceMappingURL=binanceApi.js.map