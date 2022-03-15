"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Volatility = void 0;
const signals_1 = require("./signals");
const chart_1 = require("../chart");
const symbols = require("../data/symbols.json");
const fee = .1;
// exported component
function Volatility() {
    return new Promise((resolve, reject) => {
        chart_1.Chart.candlesticks({ symbols, interval: '1h', limit: 5 }, (data) => {
            const result = [];
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const _item = data[key];
                    let firstCdlDir, expectedLastCdlDir, falseAccum = 0;
                    let item = [..._item];
                    const lastCandle = item.pop();
                    item.forEach((cdl, i) => {
                        if (!i) {
                            if (cdl.close >= cdl.open) {
                                firstCdlDir = signals_1.CdlDir.up;
                                expectedLastCdlDir = signals_1.CdlDir.up;
                            }
                            else {
                                firstCdlDir = signals_1.CdlDir.down;
                                expectedLastCdlDir = signals_1.CdlDir.down;
                            }
                        }
                        else {
                            if (firstCdlDir === signals_1.CdlDir.up) {
                                if ((i % 2 === 0 && cdl.close < cdl.open) ||
                                    (i % 2 !== 0 && cdl.close >= cdl.open)) {
                                    falseAccum++;
                                }
                            }
                            if (firstCdlDir === signals_1.CdlDir.down) {
                                if ((i % 2 !== 0 && cdl.close < cdl.open) ||
                                    (i % 2 === 0 && cdl.close >= cdl.open)) {
                                    falseAccum++;
                                }
                            }
                        }
                    });
                    if (!falseAccum) {
                        const volatility = {
                            minLong: 999,
                            minShort: 999
                        };
                        item.forEach((cdl, i) => {
                            if (cdl.close >= cdl.open) {
                                const changePerc = (cdl.high - cdl.low) / (cdl.low / 100);
                                if (changePerc < volatility.minLong) {
                                    volatility.minLong = changePerc;
                                }
                            }
                            else {
                                const changePerc = (cdl.high - cdl.low) / (cdl.high / 100);
                                if (changePerc < volatility.minShort) {
                                    volatility.minShort = changePerc;
                                }
                            }
                        });
                        if (expectedLastCdlDir === signals_1.CdlDir.up) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                            if (changePerc < volatility.minLong - fee && lastCandle.close >= lastCandle.open) {
                                const expectedProfit = volatility.minLong - fee - changePerc;
                                const possibleLoss = ((lastCandle.close - lastCandle.low) / (lastCandle.close / 100)) + fee;
                                if (expectedProfit > possibleLoss) {
                                    const keyResult = {
                                        key: key,
                                        position: 'long',
                                        entryPrice: lastCandle.close,
                                        expectedProfit: expectedProfit,
                                        possibleLoss: possibleLoss,
                                        stopLoss: lastCandle.low,
                                    };
                                    result.push(keyResult);
                                }
                            }
                        }
                        if (expectedLastCdlDir === signals_1.CdlDir.down) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                            if (changePerc < volatility.minShort - fee && lastCandle.close < lastCandle.open) {
                                const expectedProfit = volatility.minShort - fee - changePerc;
                                const possibleLoss = ((lastCandle.high - lastCandle.close) / (lastCandle.close / 100)) + fee;
                                if (expectedProfit > possibleLoss) {
                                    const keyResult = {
                                        key: key,
                                        position: 'short',
                                        entryPrice: lastCandle.close,
                                        expectedProfit: expectedProfit,
                                        possibleLoss: possibleLoss,
                                        stopLoss: lastCandle.high,
                                    };
                                    result.push(keyResult);
                                }
                            }
                        }
                    }
                }
            }
            resolve(result);
        });
    });
}
exports.Volatility = Volatility;
//# sourceMappingURL=volatility.js.map