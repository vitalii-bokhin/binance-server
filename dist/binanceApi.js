"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.candlesTicksStream = exports.candlesTicks = void 0;
const ws_1 = __importDefault(require("ws"));
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const binance = new node_binance_api_1.default();
const streamApi = 'wss://fstream.binance.com/stream?streams=';
const streamsSubscribers = {};
function candlesTicks({ symbols, interval, limit }, callback) {
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
exports.candlesTicks = candlesTicks;
function candlesTicksStream({ symbols, interval, limit }, callback) {
    candlesTicks({ symbols, interval, limit }, (data) => {
        const result = data;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');
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
            const { t: openTime, o: open, h: high, l: low, c: close, x: isFinal } = ticks;
            const candle = {
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
exports.candlesTicksStream = candlesTicksStream;
//# sourceMappingURL=binanceApi.js.map