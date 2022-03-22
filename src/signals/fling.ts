import { Candle, CdlDir, SymbolResult, SignalEntry, Result } from './types';

export function Fling({ fee, limit, data }: SignalEntry) {
    return new Promise<Result>((resolve, reject) => {
        const result: Result = [];

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];

                let cdlDir: CdlDir,
                    falseAccum: number = 0;

                let item = [..._item];

                const lastCandle: Candle = item.pop();

                item.forEach((cdl: Candle, i: number): void => {
                    if (!i) {
                        if (cdl.close >= cdl.open) {
                            cdlDir = 'up';
                        } else {
                            cdlDir = 'down';
                        }

                    } else {
                        if (cdlDir === 'up') {
                            if (
                                cdl.close < cdl.open ||
                                (cdl.high - cdl.low) - (cdl.close - cdl.open) > cdl.close - cdl.open
                            ) {
                                falseAccum++;
                            }
                        } else if (cdlDir === 'down') {
                            if (
                                cdl.close > cdl.open ||
                                (cdl.high - cdl.low) - (cdl.open - cdl.close) > cdl.open - cdl.close
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

                    const preLastCandle: Candle = item[item.length - 1];

                    item.forEach((cdl: Candle): void => {
                        const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                        const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);

                        if (changeLongPerc < volatility.minLong) {
                            volatility.minLong = changeLongPerc;
                        }

                        if (changeShortPerc < volatility.minShort) {
                            volatility.minShort = changeShortPerc;
                        }
                    });

                    // long
                    if (cdlDir === 'up' && lastCandle.close > lastCandle.open) {
                        const expectedProfit = volatility.minLong - fee;

                        // const stopLoss = lastCandle.low < preLastCandle.low ? lastCandle.low : preLastCandle.low;
                        const stopLoss = lastCandle.low;

                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100) + fee;

                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult: SymbolResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                stopLoss,
                            };

                            result.push(keyResult);
                        }
                    }

                    // short
                    if (cdlDir === 'down' && lastCandle.close < lastCandle.open) {
                        const expectedProfit = volatility.minShort - fee;

                        // const stopLoss = lastCandle.high > preLastCandle.high ? lastCandle.high : preLastCandle.high;
                        const stopLoss = lastCandle.high;

                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100) + fee;

                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult: SymbolResult = {
                                symbol: key,
                                position: 'short',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                stopLoss,
                            };

                            result.push(keyResult);
                        }
                    }
                }
            }
        }

        resolve(result);
    });
}