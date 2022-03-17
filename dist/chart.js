'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Chart = void 0;
const Binance = require('node-binance-api'), user = require('./user'), events = require('events');
const binance = new Binance();
const Chart = {
    bin: binance,
    ev: new events.EventEmitter(),
    lastSymbolsPrice: function (symbols, callback) {
        binance.prices(symbols, (error, ticker) => {
            callback(+ticker[symbols]);
        });
    },
    exchangeInfo: function (callback) {
        (function run() {
            binance.exchangeInfo(function (error, data) {
                if (!Array.isArray(data.symbols)) {
                    run();
                    return;
                }
                const symbols = {};
                for (let obj of data.symbols) {
                    let filters = {
                        status: obj.status,
                        symbols: obj.baseAsset + obj.quoteAsset,
                        minNotional: undefined,
                        minPrice: undefined,
                        maxPrice: undefined,
                        tickSize: undefined,
                        stepSize: undefined,
                        minQty: undefined,
                        maxQty: undefined,
                        orderTypes: undefined,
                        icebergAllowed: undefined
                    };
                    for (let filter of obj.filters) {
                        if (filter.filterType == "MIN_NOTIONAL") {
                            filters.minNotional = filter.minNotional;
                        }
                        else if (filter.filterType == "PRICE_FILTER") {
                            filters.minPrice = filter.minPrice;
                            filters.maxPrice = filter.maxPrice;
                            filters.tickSize = filter.tickSize;
                        }
                        else if (filter.filterType == "LOT_SIZE") {
                            filters.stepSize = filter.stepSize;
                            filters.minQty = filter.minQty;
                            filters.maxQty = filter.maxQty;
                        }
                    }
                    filters.orderTypes = obj.orderTypes;
                    filters.icebergAllowed = obj.icebergAllowed;
                    if (!symbols[obj.quoteAsset]) {
                        symbols[obj.quoteAsset] = {};
                    }
                    symbols[obj.quoteAsset][obj.baseAsset] = filters;
                }
                callback(symbols);
            });
        })();
    },
    symbolsChange24: function (symbols, callback) {
        (function f() {
            binance.prevDay(symbols, (err, res) => {
                if (err)
                    return;
                if ((!res || !res.length) && !symbols) {
                    setTimeout(f, 21);
                    return;
                }
                callback(res);
            });
        })();
    },
    candlesTicks: function (opt, callback) {
        const result = {};
        let i = 0;
        opt.symbols.forEach(sym => {
            const ticksArr = [];
            binance.futuresCandles(sym, opt.interval, { limit: opt.limit }).then(ticks => {
                ticks.forEach((tick, i) => {
                    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;
                    ticksArr[i] = {
                        openTime: time,
                        open: +open,
                        high: +high,
                        low: +low,
                        close: +close,
                        volume: +volume
                    };
                });
                result[sym] = ticksArr;
                i++;
                if (i === opt.symbols.length) {
                    callback(result);
                }
            });
        });
    },
    wsSymbolsChange24: function () {
        binance.websockets.prevDay(false, (err, res) => {
            this.ev.emit('wsSymbolsChange24', res);
        });
    },
    wsCandlesTicks: function (symbArr) {
        // binance.websockets.candlesticks(symbArr, "5m", (candlesticks) => {
        // 	let { e: eventType, E: eventTime, s: symbol, k: ticks } = candlesticks;
        // 	let { o: open, h: high, l: low, c: close, v: volume, n: trades, i: interval, x: isFinal, q: quoteVolume, V: buyVolume, Q: quoteBuyVolume } = ticks;
        // 	this.ev.emit('wsCandlesTicks', { open, high, low, close });
        // });
        const r = Math.random() * 100;
        binance.futuresChart('BTCUSDT', '1m', (symbol, interval, candlesTicks) => {
            // console.log(candlesTicks);
            // let i = 0;
            // for (const key in candlesTicks) {
            // 	if (Object.prototype.hasOwnProperty.call(candlesTicks, key)) {
            // 		const element = candlesTicks[key];
            // 		i++;
            // 	}
            // }
            console.log(r);
        }, 1);
    },
    wsTerminate: function (endpoint) {
        binance.websockets.terminate(endpoint);
    }
};
exports.Chart = Chart;
//# sourceMappingURL=chart.js.map