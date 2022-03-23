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
                        minLong: 999,
                        minShort: 999,
                        dtChangeLong: 0,
                        dtChangeShort: 0,
                        expectedChangeLong: 0,
                        expectedChangeShort: 0
                    };
                    const preLastCandle = item[item.length - 1];
                    let prevChangeLongPerc = 0, prevChangeShortPerc = 0;
                    item.forEach((cdl) => {
                        const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                        const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);
                        volatility.dtChangeLong = changeLongPerc - prevChangeLongPerc;
                        volatility.dtChangeShort = changeShortPerc - prevChangeShortPerc;
                        volatility.expectedChangeLong = changeLongPerc + volatility.dtChangeLong;
                        volatility.expectedChangeShort = changeShortPerc + volatility.dtChangeShort;
                        prevChangeLongPerc = changeLongPerc;
                        prevChangeShortPerc = changeShortPerc;
                        if (changeLongPerc < volatility.minLong) {
                            volatility.minLong = changeLongPerc;
                        }
                        if (changeShortPerc < volatility.minShort) {
                            volatility.minShort = changeShortPerc;
                        }
                    });
                    // long
                    if (cdlDir === 'up' &&
                        lastCandle.close > lastCandle.open &&
                        lastCandle.high - lastCandle.close < lastCandle.close - lastCandle.low) {
                        const expectedProfit = volatility.expectedChangeLong - (lastCandle.close - lastCandle.low) / (lastCandle.low / 100) - fee;
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
                                signal: 'fling'
                            };
                            result.push(keyResult);
                        }
                    }
                    // short
                    if (cdlDir === 'down' &&
                        lastCandle.close < lastCandle.open &&
                        lastCandle.close - lastCandle.low < lastCandle.high - lastCandle.close) {
                        const expectedProfit = volatility.expectedChangeShort - (lastCandle.high - lastCandle.close) / (lastCandle.high / 100) - fee;
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
                                signal: 'fling'
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