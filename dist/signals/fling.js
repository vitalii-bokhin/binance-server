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
                    else {
                        if (cdlDir === 'up') {
                            if (cdl.close < cdl.open ||
                                (cdl.high - cdl.low) - (cdl.close - cdl.open) > cdl.close - cdl.open) {
                                falseAccum++;
                            }
                        }
                        else if (cdlDir === 'down') {
                            if (cdl.close > cdl.open ||
                                (cdl.high - cdl.low) - (cdl.open - cdl.close) > cdl.open - cdl.close) {
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
                    const preLastCandle = item[item.length - 1];
                    item.forEach((cdl) => {
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
                            const keyResult = {
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
                            const keyResult = {
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
exports.Fling = Fling;
//# sourceMappingURL=fling.js.map