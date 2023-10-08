"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandlesTicksStream = exports.candlesTicksEvent = void 0;
const events_1 = __importDefault(require("events"));
const ws_1 = __importDefault(require("ws"));
const _1 = require(".");
const CandlesTicks_1 = require("./CandlesTicks");
const binanceApi_1 = require("./binanceApi");
exports.candlesTicksEvent = new events_1.default.EventEmitter();
let candlesTicksStreamExecuted = false;
// const candlesTicksStreamSubscribers: ((arg0: any) => void)[] = [];
function CandlesTicksStream(opt, callback) {
    // if (callback) {
    //     candlesTicksStreamSubscribers.push(callback);
    // }
    if (!candlesTicksStreamExecuted && opt) {
        const { symbols, interval, limit } = opt;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');
        candlesTicksStreamExecuted = true;
        (0, CandlesTicks_1.CandlesTicks)({ symbols, interval, limit }, data => {
            const result = data;
            let ws;
            if (binanceApi_1.wsStreams[streams] !== undefined) {
                ws = binanceApi_1.wsStreams[streams];
            }
            else {
                ws = new ws_1.default(_1.streamApi + streams);
                binanceApi_1.wsStreams[streams] = ws;
            }
            ws.on('message', function message(wsMsg) {
                const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(wsMsg).data;
                const { t: openTime, o: open, h: high, l: low, c: close, v: volume, V: buyVolume } = ticks;
                const candle = {
                    openTime: openTime,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close,
                    volume: +volume,
                    new: null,
                };
                if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                    candle.new = true;
                    result[symbol].push(candle);
                    result[symbol].shift();
                }
                else {
                    candle.new = false;
                    result[symbol][result[symbol].length - 1] = candle;
                }
                exports.candlesTicksEvent.emit(symbol, result[symbol]);
                // candlesTicksStreamSubscribers.forEach(cb => cb(result));
                // if (symbolCandlesTicksStreamSubscribers[symbol]) {
                //     symbolCandlesTicksStreamSubscribers[symbol].forEach(cb => cb(result[symbol]));
                // }
            });
        });
    }
}
exports.CandlesTicksStream = CandlesTicksStream;
// const symbolCandlesTicksStreamSubscribers: {
//     [key: string]: ((arg0: any) => void)[];
// } = {};
// export function symbolCandlesTicksStream(symbol: string, callback: SymbolCandlesTicksCallback, clearSymbolCallback?: boolean) {
//     if (symbol && callback) {
//         if (!symbolCandlesTicksStreamSubscribers[symbol]) {
//             symbolCandlesTicksStreamSubscribers[symbol] = [];
//         }
//         symbolCandlesTicksStreamSubscribers[symbol].push(callback);
//     }
//     if (clearSymbolCallback && symbolCandlesTicksStreamSubscribers[symbol]) {
//         delete symbolCandlesTicksStreamSubscribers[symbol];
//     }
// }
//# sourceMappingURL=CandlesTicksStream.js.map