import { Candle, CdlDir, KeyResult, Result } from './signals';
import { Chart } from '../chart';
import symbols = require('../data/symbols.json');

const fee: number = .1;

// exported component
function Volatility() {
    return new Promise<Result>((resolve, reject) => {
        Chart.candlesticks({ symbols, interval: '1h', limit: 5 }, (data) => {
            const result: Result = [];

            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const _item = data[key];

                    let firstCdlDir: string,
                        expectedLastCdlDir: string | undefined,
                        falseAccum: number = 0;

                    let item = [..._item];

                    const lastCandle: Candle = item.pop();

                    item.forEach((cdl: Candle, i: number): void => {
                        if (!i) {
                            if (cdl.close >= cdl.open) {
                                firstCdlDir = CdlDir.up;
                                expectedLastCdlDir = CdlDir.up;
                            } else {
                                firstCdlDir = CdlDir.down;
                                expectedLastCdlDir = CdlDir.down;
                            }

                        } else {
                            if (firstCdlDir === CdlDir.up) {
                                if (
                                    (i % 2 === 0 && cdl.close < cdl.open) ||
                                    (i % 2 !== 0 && cdl.close >= cdl.open)
                                ) {
                                    falseAccum++;
                                }
                            }

                            if (firstCdlDir === CdlDir.down) {
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

                        if (expectedLastCdlDir === CdlDir.up) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);

                            if (changePerc < volatility.minLong - fee && lastCandle.close >= lastCandle.open) {
                                const expectedProfit = volatility.minLong - fee - changePerc;

                                const possibleLoss = ((lastCandle.close - lastCandle.low) / (lastCandle.close / 100)) + fee;

                                if (expectedProfit > possibleLoss) {
                                    const keyResult: KeyResult = {
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

                        if (expectedLastCdlDir === CdlDir.down) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);

                            if (changePerc < volatility.minShort - fee && lastCandle.close < lastCandle.open) {
                                const expectedProfit = volatility.minShort - fee - changePerc;

                                const possibleLoss = ((lastCandle.high - lastCandle.close) / (lastCandle.close / 100)) + fee;

                                if (expectedProfit > possibleLoss) {
                                    const keyResult: KeyResult = {
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

export { Volatility };