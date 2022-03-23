"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Aisle = void 0;
function Aisle({ fee, limit, data }) {
    return new Promise((resolve, reject) => {
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
                            firstCdlDir = 'up';
                            if (limit % 2 == 0) {
                                expectedLastCdlDir = 'down';
                            }
                            else {
                                expectedLastCdlDir = 'up';
                            }
                        }
                        else {
                            firstCdlDir = 'down';
                            if (limit % 2 == 0) {
                                expectedLastCdlDir = 'up';
                            }
                            else {
                                expectedLastCdlDir = 'down';
                            }
                        }
                    }
                    else {
                        if (firstCdlDir === 'up') {
                            if ((i % 2 === 0 && cdl.close < cdl.open) ||
                                (i % 2 !== 0 && cdl.close >= cdl.open)) {
                                falseAccum++;
                            }
                        }
                        if (firstCdlDir === 'down') {
                            if ((i % 2 !== 0 && cdl.close < cdl.open) ||
                                (i % 2 === 0 && cdl.close >= cdl.open)) {
                                falseAccum++;
                            }
                        }
                    }
                });
                if (!falseAccum) {
                    const volatility = {
                        // minLong: 999,
                        // minShort: 999,
                        // maxLong: 0,
                        // maxShort: 0,
                        maxHigh: 0,
                        minHigh: 99999,
                        maxLow: 0,
                        minLow: 99999
                    };
                    let sumChange = 0, sumClose = 0;
                    item.forEach((cdl) => {
                        // const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                        // const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);
                        // if (changeLongPerc > volatility.maxLong) {
                        //     volatility.maxLong = changeLongPerc;
                        // }
                        // if (changeLongPerc < volatility.minLong) {
                        //     volatility.minLong = changeLongPerc;
                        // }
                        // if (changeShortPerc > volatility.maxShort) {
                        //     volatility.maxShort = changeShortPerc;
                        // }
                        // if (changeShortPerc < volatility.minShort) {
                        //     volatility.minShort = changeShortPerc;
                        // }
                        sumClose += cdl.close;
                        sumChange += (cdl.high - cdl.low) / (cdl.low / 100);
                        if (cdl.high > volatility.maxHigh) {
                            volatility.maxHigh = cdl.high;
                        }
                        if (cdl.high < volatility.minHigh) {
                            volatility.minHigh = cdl.high;
                        }
                        if (cdl.low > volatility.maxLow) {
                            volatility.maxLow = cdl.low;
                        }
                        if (cdl.low < volatility.minLow) {
                            volatility.minLow = cdl.low;
                        }
                    });
                    const avrgClose = (sumClose + lastCandle.close) / limit;
                    const partOfAvrgChange = sumChange / item.length / 2;
                    const lowDtPerc = (volatility.maxLow - volatility.minLow) / (volatility.minLow / 100);
                    if (expectedLastCdlDir === 'up' &&
                        lowDtPerc < partOfAvrgChange &&
                        lastCandle.close > lastCandle.open &&
                        lastCandle.high - lastCandle.close < lastCandle.close - lastCandle.low) {
                        const expectedProfit = (volatility.minHigh - lastCandle.close) / (lastCandle.close / 100) - fee;
                        const stopLoss = (lastCandle.low < volatility.minLow ? lastCandle.low : volatility.minLow) - (volatility.maxLow - volatility.minLow);
                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100) + fee;
                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                stopLoss,
                                signal: 'aisle'
                            };
                            result.push(keyResult);
                        }
                    }
                    const highDtPerc = (volatility.maxHigh - volatility.minHigh) / (volatility.minHigh / 100);
                    if (expectedLastCdlDir === 'down' &&
                        highDtPerc < partOfAvrgChange &&
                        lastCandle.close < lastCandle.open &&
                        lastCandle.close - lastCandle.low < lastCandle.high - lastCandle.close) {
                        const expectedProfit = (lastCandle.close - volatility.maxLow) / (lastCandle.close / 100) - fee;
                        const stopLoss = (lastCandle.high > volatility.maxHigh ? lastCandle.high : volatility.maxHigh) + (volatility.maxHigh - volatility.minHigh);
                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100) + fee;
                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult = {
                                symbol: key,
                                position: 'short',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                stopLoss,
                                signal: 'aisle'
                            };
                            result.push(keyResult);
                        }
                    }
                    // if (expectedLastCdlDir === 'up') {
                    //     const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.low / 100);
                    //     if (changePerc < volatility.minLong - fee) {
                    //         const expectedProfit = volatility.minLong - fee - changePerc;
                    //         const possibleLoss = ((lastCandle.close - lastCandle.low) / (lastCandle.close / 100)) + fee;
                    //         if (expectedProfit > possibleLoss) {
                    //             const keyResult: SymbolResult = {
                    //                 symbol: key,
                    //                 position: 'long',
                    //                 entryPrice: lastCandle.close,
                    //                 expectedProfit: expectedProfit,
                    //                 possibleLoss: possibleLoss,
                    //                 stopLoss: lastCandle.low,
                    //             };
                    //             result.push(keyResult);
                    //         }
                    //     }
                    // }
                    // if (expectedLastCdlDir === 'down') {
                    //     const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                    //     if (changePerc < volatility.minShort - fee && lastCandle.close < lastCandle.open) {
                    //         const expectedProfit = volatility.minShort - fee - changePerc;
                    //         const possibleLoss = ((lastCandle.high - lastCandle.close) / (lastCandle.close / 100)) + fee;
                    //         if (expectedProfit > possibleLoss) {
                    //             const keyResult: SymbolResult = {
                    //                 symbol: key,
                    //                 position: 'short',
                    //                 entryPrice: lastCandle.close,
                    //                 expectedProfit: expectedProfit,
                    //                 possibleLoss: possibleLoss,
                    //                 stopLoss: lastCandle.high,
                    //             };
                    //             result.push(keyResult);
                    //         }
                    //     }
                    // }
                }
            }
        }
        resolve(result);
    });
}
exports.Aisle = Aisle;
//# sourceMappingURL=aisle.js.map