"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepthStream = void 0;
const ws_1 = __importDefault(require("ws"));
const _1 = require(".");
const Depth_1 = require("./Depth");
const binanceApi_1 = require("./binanceApi");
let depthStreamExecuted = false;
const depthStreamSubscribers = [];
function DepthStream(symbols, callback) {
    if (callback) {
        depthStreamSubscribers.push(callback);
    }
    if (!depthStreamExecuted) {
        const streams = symbols.map(s => s.toLowerCase() + '@depth@500ms').join('/');
        depthStreamExecuted = true;
        (0, Depth_1.Depth)(symbols, data => {
            let ws;
            let lastFinalUpdId;
            const result = Object.assign({}, data);
            if (binanceApi_1.wsStreams[streams] !== undefined) {
                ws = binanceApi_1.wsStreams[streams];
            }
            else {
                ws = new ws_1.default(_1.streamApi + streams);
                binanceApi_1.wsStreams[streams] = ws;
            }
            ws.on('message', function message(data) {
                const res = JSON.parse(data).data;
                const { s: symbol, b: bids, a: asks, u: finalUpdId, pu: finalUpdIdInLast } = res;
                if (finalUpdId < result[symbol].lastUpdateId) {
                    return;
                }
                if (lastFinalUpdId && finalUpdIdInLast !== lastFinalUpdId) {
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
                depthStreamSubscribers.forEach(cb => cb(result));
            });
        });
    }
}
exports.DepthStream = DepthStream;
//# sourceMappingURL=DepthStream.js.map