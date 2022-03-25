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
        }

    }
}

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


                const volatility = {
                    avgChangeLong: 0,
                    avgChangeShort: 0
                };

                let sumChangeLongPerc = 0,
                    sumChangeShortPerc = 0;

                item.forEach((cdl: Candle): void => {
                    const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                    const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);

                    sumChangeLongPerc += changeLongPerc;
                    sumChangeShortPerc += changeShortPerc;
                });

                volatility.avgChangeLong = sumChangeLongPerc / item.length;
                volatility.avgChangeShort = sumChangeShortPerc / item.length;

                if (lastCandle.close >= lastCandle.open) {
                    // UP CANDLE
                    const lastCandleChange = (lastCandle.high - lastCandle.low) / (lastCandle.low / 100);

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
                        const stopLoss = lastCandle.close - (.1 * (lastCandle.close / 100));
                        const possibleLoss = .1 + fee;
                        const expectedProfit = volatility.avgChangeLong - lastCandleChange - fee;

                        const keyResult: SymbolResult = {
                            symbol: key,
                            position: 'long',
                            entryPrice: lastCandle.close,
                            expectedProfit,
                            possibleLoss,
                            stopLoss,
                            signal: 'scalping'
                        };

                        result.push(keyResult);
                    }

                } else {
                    // DOWN CANDLE
                    const lastCandleChange = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);

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
                        const stopLoss = lastCandle.close + (.1 * (lastCandle.close / 100));
                        const possibleLoss = .1 + fee;
                        const expectedProfit = volatility.avgChangeShort - lastCandleChange - fee;

                        const keyResult: SymbolResult = {
                            symbol: key,
                            position: 'short',
                            entryPrice: lastCandle.close,
                            expectedProfit,
                            possibleLoss,
                            stopLoss,
                            signal: 'scalping'
                        };

                        result.push(keyResult);
                    }
                }

            }
        }

        resolve(result);
    });
}