"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTickerStreamCache = exports.tickerStream = exports.priceStream = exports.positionUpdateStream = exports.ordersUpdateStream = exports.wsStreams = void 0;
const _1 = require(".");
// check server time
_1.binance.time().then(res => {
    console.log('Server Time: ' + new Date(res.serverTime));
});
exports.wsStreams = {};
// account data stream (position, order update)
const orderUpdateSubscribers = {};
const positionUpdateSubscribers = {};
const userFutureDataSubscribers = {};
let userFutureDataExecuted = false;
const userFutureDataSubscribe = function (key, callback) {
    userFutureDataSubscribers[key] = callback;
    if (!userFutureDataExecuted) {
        userFutureDataExecuted = true;
        _1.binance.websockets.userFutureData(null, (res) => {
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
        _1.binance.futuresMarkPriceStream((res) => {
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
        _1.binance.futuresTickerStream(res => {
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