"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Fling = void 0;
function Fling({ fee, limit, data }) {
    return new Promise((resolve, reject) => {
        const result = [];
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];
                let cdlDir, falseAccum = 0;
                let item = [..._item];
                const lastCandle = item.pop();
                item.forEach((cdl, i) => {
                    if (!i) {
                        if (cdl.close >= cdl.open) {
                            cdlDir = 'up';
                        }
                        else {
                            cdlDir = 'down';
                        }
                    }
                    if (cdlDir === 'up') {
                        if (cdl.close < cdl.open ||
                            cdl.high - cdl.close > cdl.close - cdl.low) {
                            falseAccum++;
                        }
                    }
                    else if (cdlDir === 'down') {
                        if (cdl.close > cdl.open ||
                            cdl.close - cdl.low > cdl.high - cdl.close) {
                            falseAccum++;
                        }
                    }
                });
                if (!falseAccum) {
                    const volatility = {
                        avgChangeLong: 0,
                        avgChangeShort: 0
                    };
                    let sumChangeLongPerc = 0, sumChangeShortPerc = 0;
                    item.forEach((cdl) => {
                        const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                        const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);
                        sumChangeLongPerc += changeLongPerc;
                        sumChangeShortPerc += changeShortPerc;
                    });
                    volatility.avgChangeLong = sumChangeLongPerc / item.length;
                    volatility.avgChangeShort = sumChangeShortPerc / item.length;
                    // long
                    if (cdlDir === 'up' &&
                        lastCandle.close > lastCandle.open &&
                        lastCandle.high - lastCandle.close < lastCandle.close - lastCandle.low) {
                        const lastCandleChange = (lastCandle.high - lastCandle.low) / (lastCandle.low / 100);
                        const expectedProfit = volatility.avgChangeLong - lastCandleChange - fee;
                        const stopLoss = lastCandle.low;
                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100) + fee;
                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                // stopLoss,
                                signal: 'fling',
                                preferIndex: expectedProfit
                            };
                            result.push(keyResult);
                        }
                    }
                    // short
                    if (cdlDir === 'down' &&
                        lastCandle.close < lastCandle.open &&
                        lastCandle.close - lastCandle.low < lastCandle.high - lastCandle.close) {
                        const lastCandleChange = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                        const expectedProfit = volatility.avgChangeShort - lastCandleChange - fee;
                        const stopLoss = lastCandle.high;
                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100) + fee;
                        if (expectedProfit > possibleLoss && expectedProfit > fee) {
                            const keyResult = {
                                symbol: key,
                                position: 'short',
                                entryPrice: lastCandle.close,
                                expectedProfit: expectedProfit,
                                possibleLoss: possibleLoss,
                                // stopLoss,
                                signal: 'fling',
                                preferIndex: expectedProfit
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
exports.Fling = Fling;
//# sourceMappingURL=fling.js.map