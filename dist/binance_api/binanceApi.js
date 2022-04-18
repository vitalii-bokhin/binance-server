"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepthStream = exports.Depth = exports.getTickerStreamCache = exports.tickerStream = exports.priceStream = exports.positionUpdateStream = exports.ordersUpdateStream = exports.wsStreams = void 0;
const ws_1 = __importDefault(require("ws"));
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
// Orders Book
let depthStreamExecuted = false;
const depthStreamSubscribers = [];
function Depth(symbols, callback) {
    const result = {};
    let i = 0;
    symbols.forEach(sym => {
        _1.binance.futuresDepth(sym, { limit: 100 }).then(data => {
            result[sym] = data;
            console.log(data.bids.length);
            i++;
            if (i === symbols.length) {
                callback(result);
            }
        }).catch((error) => {
            console.log(new Error(error));
        });
    });
}
exports.Depth = Depth;
function DepthStream(symbols, callback) {
    if (callback) {
        depthStreamSubscribers.push(callback);
    }
    if (!depthStreamExecuted) {
        const streams = symbols.map(s => s.toLowerCase() + '@depth@500ms').join('/');
        depthStreamExecuted = true;
        let c = 0;
        Depth(symbols, data => {
            let ws;
            let lastFinalUpdId;
            const result = Object.assign({}, data);
            // console.log(result['WAVESUSDT'].bids);
            if (exports.wsStreams[streams] !== undefined) {
                ws = exports.wsStreams[streams];
            }
            else {
                ws = new ws_1.default(_1.streamApi + streams);
                exports.wsStreams[streams] = ws;
            }
            ws.on('message', function message(data) {
                console.log(c);
                c++;
                const res = JSON.parse(data).data;
                const { s: symbol, b: bids, a: asks, u: finalUpdId, pu: finalUpdIdInLast } = res;
                if (finalUpdId < result[symbol].lastUpdateId) {
                    console.log('ret--------1----------');
                    return;
                }
                if (lastFinalUpdId && finalUpdIdInLast !== lastFinalUpdId) {
                    console.log('ret--------2----------');
                    return;
                }
                else {
                    lastFinalUpdId = finalUpdId;
                }
                // Bids
                bids.reverse();
                const prelBids = [];
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
                const resultBids = [];
                for (let i = 0; i < prelBids.length; i++) {
                    const cBid = prelBids[i];
                    for (const newB of bids) {
                        if (newB[0] !== cBid[0] && +newB[1] !== 0) {
                            if (!i && +newB[0] > +cBid[0]) {
                                resultBids.push(newB);
                            }
                            else if (i && +prelBids[i - 1][0] > +newB[0] && +newB[0] > +cBid[0]) {
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
                const prelAsks = [];
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
                const resultAsks = [];
                for (let i = 0; i < prelAsks.length; i++) {
                    const cAsk = prelAsks[i];
                    for (const newA of asks) {
                        if (newA[0] !== cAsk[0] && +newA[1] !== 0) {
                            if (!i && +newA[0] < +cAsk[0]) {
                                resultAsks.push(newA);
                            }
                            else if (i && +prelAsks[i - 1][0] < +newA[0] && +newA[0] < +cAsk[0]) {
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
exports.DepthStream = DepthStream;
//# sourceMappingURL=binanceApi.js.map