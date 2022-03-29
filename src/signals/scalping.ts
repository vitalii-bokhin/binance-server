import { Candle, CdlDir, SymbolResult, SignalEntry, Result } from './types';

const analyzeCandle = function (cdl: Candle, pos: 'long' | 'short'): 'stopLong' | 'stopShort' | 'stopBoth' {
    if (cdl.close >= cdl.open) {
        // UP CANDLE
        const highTail = cdl.high - cdl.close;
        const body = cdl.close - cdl.open;
        const lowTail = cdl.open - cdl.low;

        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        } else if (pos == 'long' && highTail / (body + lowTail) > .3) {
            return 'stopLong';
        } else if (pos == 'short' && lowTail / (body + highTail) > .3) {
            return 'stopShort';
        } else if (pos == 'short' && highTail / (body + lowTail) < .3) {
            return 'stopShort';
        }

    } else {
        // DOWN CANDLE
        const highTail = cdl.high - cdl.open;
        const body = cdl.open - cdl.close;
        const lowTail = cdl.close - cdl.low;

        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        } else if (pos == 'short' && lowTail / (body + highTail) > .3) {
            return 'stopShort';
        } else if (pos == 'long' && highTail / (body + lowTail) > .3) {
            return 'stopLong';
        } else if (pos == 'long' && lowTail / (body + highTail) < .3) {
            return 'stopLong';
        }

    }
}

// const changeDelta: {
//     [key: string]: {
//         lastPrice: number;
//         changePerc: number;
//         position: 'long' | 'short' | null;
//         ticks: number;
//     }
// } = {};

export function Scalping({ fee, limit, data }: SignalEntry) {
    return new Promise<Result>((resolve, reject) => {
        const result: Result = [];

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];

                let item = [..._item];

                const lastCandle: Candle = item.pop();
                const prevCandle: Candle = item[item.length - 1];
                const prePrevCandle: Candle = item[item.length - 2];

                if (!lastCandle || !prevCandle || !prePrevCandle) {
                    continue;
                }

                // if (!changeDelta[key] && !lastCandle.isFinal) {
                //     changeDelta[key] = {
                //         lastPrice: lastCandle.close,
                //         changePerc: 0,
                //         position: null,
                //         ticks: 0
                //     }
                // } else if (lastCandle.isFinal) {
                //     delete changeDelta[key];
                // } else {
                //     const lastPrice = changeDelta[key].lastPrice;
                //     let position: 'long' | 'short';
                //     let changePerc: number;

                //     if (lastCandle.close > lastPrice) {
                //         position = 'long';
                //         changePerc = (lastCandle.close - lastPrice) / (lastPrice / 100);
                //     } else if (lastCandle.close < lastPrice) {
                //         position = 'short';
                //         changePerc = (lastPrice - lastCandle.close) / (lastPrice / 100);
                //     }

                //     if (position) {
                //         if (changeDelta[key].position == position) {
                //             changeDelta[key].changePerc += changePerc;
                //             changeDelta[key].ticks += 1;
                //         } else {
                //             changeDelta[key].changePerc = changePerc;
                //             changeDelta[key].position = position;
                //             changeDelta[key].ticks = 0;
                //         }
                //     }

                //     changeDelta[key].lastPrice = lastCandle.close;
                // }

                // if (changeDelta[key].ticks < 10) {
                //     continue;
                // }

                // const keyResult: SymbolResult = {
                //     symbol: key,
                //     position: changeDelta[key].position,
                //     entryPrice: lastCandle.close,
                //     expectedProfit: changeDelta[key].changePerc,
                //     signal: 'scalping',
                //     preferIndex: changeDelta[key].changePerc
                // };

                // result.push(keyResult);

                const volatility = {
                    avgChangeLong: 0,
                    avgChangeShort: 0,
                    avgHigh: 0,
                    avgLow: 0,
                    maxHigh: 0,
                    minHigh: 99999,
                    maxLow: 0,
                    minLow: 99999
                };

                const changesLong: number[] = [],
                    changesShort: number[] = [];

                let sumHigh = 0,
                    sumLow = 0;

                item.forEach((cdl: Candle): void => {
                    if (cdl.close > cdl.open) {
                        changesLong.push(cdl.high - cdl.low);
                    } else if (cdl.open > cdl.close) {
                        changesShort.push(cdl.high - cdl.low);
                    }

                    sumHigh += cdl.high;
                    sumLow += cdl.low;

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

                volatility.avgChangeLong = changesLong.reduce((a, c) => a + c, 0) / changesLong.length;
                volatility.avgChangeShort = changesShort.reduce((a, c) => a + c, 0) / changesShort.length;
                volatility.avgHigh = sumHigh / item.length;
                volatility.avgLow = sumLow / item.length;

                const lastCandleChange = lastCandle.high - lastCandle.low;

                if (lastCandle.close >= lastCandle.open) {
                    // UP CANDLE
                    if (lastCandleChange > volatility.avgChangeLong / 2) {
                        continue;
                    }

                    let prevSignal = analyzeCandle(prePrevCandle, 'long');

                    if (prevSignal == 'stopLong') {
                        continue;
                    }

                    prevSignal = analyzeCandle(prevCandle, 'long');

                    if (prevSignal == 'stopBoth' || prevSignal == 'stopLong') {
                        continue;
                    }

                    const highTail = lastCandle.high - lastCandle.close;
                    const body = lastCandle.close - lastCandle.open;
                    const lowTail = lastCandle.open - lastCandle.low;

                    if (highTail < lowTail && body > highTail) {
                        const stopLoss = lastCandle.low;
                        const takeProfit = lastCandle.close + (volatility.avgChangeLong - lastCandleChange);
                        
                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100) + fee;
                        const expectedProfit = (takeProfit - lastCandle.close) / (lastCandle.close / 100) - fee;

                        if (expectedProfit > possibleLoss) {
                            const keyResult: SymbolResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                stopLoss,
                                takeProfit,
                                expectedProfit,
                                possibleLoss,
                                signal: 'scalping',
                                preferIndex: expectedProfit / possibleLoss
                            };

                            result.push(keyResult);
                        }
                    }

                } else {
                    // DOWN CANDLE
                    if (lastCandleChange > volatility.avgChangeShort / 2) {
                        continue;
                    }

                    let prevSignal = analyzeCandle(prePrevCandle, 'short');

                    if (prevSignal == 'stopShort') {
                        continue;
                    }

                    prevSignal = analyzeCandle(prevCandle, 'short');

                    if (prevSignal == 'stopBoth' || prevSignal == 'stopShort') {
                        continue;
                    }

                    const highTail = lastCandle.high - lastCandle.open;
                    const body = lastCandle.open - lastCandle.close;
                    const lowTail = lastCandle.close - lastCandle.low;

                    if (lowTail < highTail && body > lowTail) {
                        const stopLoss = lastCandle.high;
                        const takeProfit = lastCandle.close - (volatility.avgChangeShort - lastCandleChange);
                        
                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100) + fee;
                        const expectedProfit = (lastCandle.close - takeProfit) / (lastCandle.close / 100) - fee;

                        if (expectedProfit > possibleLoss) {
                            const keyResult: SymbolResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                stopLoss,
                                takeProfit,
                                expectedProfit,
                                possibleLoss,
                                signal: 'scalping',
                                preferIndex: expectedProfit / possibleLoss
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