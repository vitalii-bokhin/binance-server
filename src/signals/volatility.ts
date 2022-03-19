import { Candle, CdlDir, SymbolResult, SignalEntry, Result } from './types';

// exported component
function Volatility({ fee, limit, data }: SignalEntry) {
    return new Promise<Result>((resolve, reject) => {
        const result: Result = [];

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];

                let firstCdlDir: CdlDir,
                    expectedLastCdlDir: CdlDir,
                    falseAccum: number = 0;

                let item = [..._item];

                const lastCandle: Candle = item.pop();

                item.forEach((cdl: Candle, i: number): void => {
                    if (!i) {
                        if (cdl.close >= cdl.open) {
                            firstCdlDir = 'up';

                            if (limit % 2 == 0) {
                                expectedLastCdlDir = 'down';
                            } else {
                                expectedLastCdlDir = 'up';
                            }
                        } else {
                            firstCdlDir = 'down';

                            if (limit % 2 == 0) {
                                expectedLastCdlDir = 'up';
                            } else {
                                expectedLastCdlDir = 'down';
                            }
                        }

                    } else {
                        if (firstCdlDir === 'up') {
                            if (
                                (i % 2 === 0 && cdl.close < cdl.open) ||
                                (i % 2 !== 0 && cdl.close >= cdl.open)
                            ) {
                                falseAccum++;
                            }
                        }

                        if (firstCdlDir === 'down') {
                            if (
                                (i % 2 !== 0 && cdl.close < cdl.open) ||
                                (i % 2 === 0 && cdl.close >= cdl.open)
                            ) {
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

                    let sumChange = 0;

                    item.forEach((cdl: Candle, i: number): void => {
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

                    const partOfAvrgChange = sumChange / limit;

                    const highDtPerc = (volatility.maxHigh - volatility.minHigh) / (volatility.minHigh / 100);
                    const lowDtPerc = (volatility.maxLow - volatility.minLow) / (volatility.minLow / 100);

                    if (highDtPerc < partOfAvrgChange && lowDtPerc < partOfAvrgChange) {

                        if (expectedLastCdlDir === 'up') {
                            const expectedProfit = (volatility.minHigh - lastCandle.close) / (lastCandle.close / 100) - fee;
                            const possibleLoss = (lastCandle.close - volatility.minLow) / (lastCandle.close / 100) + fee;

                            if (expectedProfit > possibleLoss) {
                                const keyResult: SymbolResult = {
                                    symbol: key,
                                    position: 'long',
                                    entryPrice: lastCandle.close,
                                    expectedProfit: expectedProfit,
                                    possibleLoss: possibleLoss,
                                    stopLoss: volatility.minLow,
                                };

                                result.push(keyResult);
                            }
                        }

                        if (expectedLastCdlDir === 'down') {
                            const expectedProfit = (lastCandle.close - volatility.maxLow) / (lastCandle.close / 100) - fee;
                            const possibleLoss = (volatility.maxHigh - lastCandle.close) / (lastCandle.close / 100) + fee;

                            if (expectedProfit > possibleLoss) {
                                const keyResult: SymbolResult = {
                                    symbol: key,
                                    position: 'short',
                                    entryPrice: lastCandle.close,
                                    expectedProfit: expectedProfit,
                                    possibleLoss: possibleLoss,
                                    stopLoss: volatility.maxHigh,
                                };

                                result.push(keyResult);
                            }
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

export { Volatility };