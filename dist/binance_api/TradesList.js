"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesListStream = exports.TradesList = void 0;
const ws_1 = __importDefault(require("ws"));
const _1 = require(".");
const wsStreams = {};
let streamExecuted = false;
const streamSubscribers = [];
function TradesList(symbols, callback) {
    const result = {};
    let i = 0;
    symbols.forEach(sym => {
        _1.binance.futuresTrades(sym, { limit: 1000 }).then(data => {
            result[sym] = data;
            i++;
            if (i === symbols.length) {
                callback(result);
            }
        }).catch((error) => {
            console.log(new Error(error));
        });
    });
}
exports.TradesList = TradesList;
function TradesListStream(symbols, callback) {
    if (callback) {
        streamSubscribers.push(callback);
    }
    if (!streamExecuted) {
        const streams = symbols.map(s => s.toLowerCase() + '@aggTrade').join('/');
        streamExecuted = true;
        // TradesList(symbols, data => {
        // const result = {};
        let ws;
        if (wsStreams[streams] !== undefined) {
            ws = wsStreams[streams];
        }
        else {
            ws = new ws_1.default(_1.streamApi + streams);
            wsStreams[streams] = ws;
        }
        ws.on('message', function message(data) {
            const res = JSON.parse(data).data;
            const { s: symbol, p: price, q: qty, m: isBuyerMaker } = res;
            streamSubscribers.forEach(cb => cb({ symbol, price, qty, isBuyerMaker }));
        });
        // });
    }
}
exports.TradesListStream = TradesListStream;
//# sourceMappingURL=TradesList.js.map