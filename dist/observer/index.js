"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CandlesTicksStream_1 = require("../binance_api/CandlesTicksStream");
const Observer_1 = __importDefault(require("./Observer"));
const symbols = ['BTCUSDT' /* , 'MANAUSDT', 'GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT', 'FTMUSDT', 'MATICUSDT' */];
const interval = '1m';
const limit = 99; // candles ticks limit
// const { symbolsObj } = await getSymbols();
(0, CandlesTicksStream_1.CandlesTicksStream)({ symbols, interval, limit }, null);
// ordersUpdateStream();
for (const symbol of symbols) {
    const observer = new Observer_1.default(symbol);
    observer.start();
}
console.log(`The script has been run. ${limit} candles with interval ${interval}.`);
//# sourceMappingURL=index.js.map