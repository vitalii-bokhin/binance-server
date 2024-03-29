"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandlesTicks = void 0;
const _1 = require(".");
function CandlesTicks({ symbols, interval, limit }, callback) {
    const result = {};
    let i = 0;
    symbols.forEach(sym => {
        const ticksArr = [];
        _1.binance.futuresCandles(sym, interval, { limit }).then((ticks) => {
            ticks.forEach((tick, i) => {
                const [openTime, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                ticksArr[i] = {
                    openTime,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close,
                    volume: +volume,
                    new: false,
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
exports.CandlesTicks = CandlesTicks;
//# sourceMappingURL=CandlesTicks.js.map