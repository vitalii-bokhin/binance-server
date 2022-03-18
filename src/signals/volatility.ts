import { Candle, CdlDir, SymbolResult, SignalEntry, Result } from './types';
 
// exported component
function Volatility({fee, data}: SignalEntry) {
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
                                expectedLastCdlDir = 'up';
                            } else {
                                firstCdlDir = 'down';
                                expectedLastCdlDir = 'down';
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
                            minLong: 999,
                            minShort: 999
                        };

                        item.forEach((cdl: Candle, i: number): void => {
                            if (cdl.close >= cdl.open) {
                                const changePerc = (cdl.high - cdl.low) / (cdl.low / 100);

                                if (changePerc < volatility.minLong) {
                                    volatility.minLong = changePerc;
                                }
                            } else {
                                const changePerc = (cdl.high - cdl.low) / (cdl.high / 100);

                                if (changePerc < volatility.minShort) {
                                    volatility.minShort = changePerc;
                                }
                            }
                        });

                        if (expectedLastCdlDir === 'up') {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);

                            if (changePerc < volatility.minLong - fee && lastCandle.close >= lastCandle.open) {
                                const expectedProfit = volatility.minLong - fee - changePerc;

                                const possibleLoss = ((lastCandle.close - lastCandle.low) / (lastCandle.close / 100)) + fee;

                                if (expectedProfit > possibleLoss) {
                                    const keyResult: SymbolResult = {
                                        symbol: key,
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

                        if (expectedLastCdlDir === 'down') {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);

                            if (changePerc < volatility.minShort - fee && lastCandle.close < lastCandle.open) {
                                const expectedProfit = volatility.minShort - fee - changePerc;

                                const possibleLoss = ((lastCandle.high - lastCandle.close) / (lastCandle.close / 100)) + fee;

                                if (expectedProfit > possibleLoss) {
                                    const keyResult: SymbolResult = {
                                        symbol: key,
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
}

export { Volatility };