"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scalping = void 0;
const analyzeCandle = function (cdl, pos) {
    if (cdl.close >= cdl.open) {
        // UP CANDLE
        const highTail = cdl.high - cdl.close;
        const body = cdl.close - cdl.open;
        const lowTail = cdl.open - cdl.low;
        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .35) {
            return 'stopLong';
        }
        else if (pos == 'short' && lowTail / (body + highTail) > .35) {
            return 'stopShort';
        }
        else if (pos == 'short' && highTail / (body + lowTail) < .35) {
            return 'stopShort';
        }
    }
    else {
        // DOWN CANDLE
        const highTail = cdl.high - cdl.open;
        const body = cdl.open - cdl.close;
        const lowTail = cdl.close - cdl.low;
        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        }
        else if (pos == 'short' && lowTail / (body + highTail) > .35) {
            return 'stopShort';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .35) {
            return 'stopLong';
        }
        else if (pos == 'long' && lowTail / (body + highTail) < .35) {
            return 'stopLong';
        }
    }
};
// const changeDelta: {
//     [key: string]: {
//         lastPrice: number;
//         changePerc: number;
//         position: 'long' | 'short' | null;
//         ticks: number;
//     }
// } = {};
function Scalping({ fee, limit, data }) {
    return new Promise((resolve, reject) => {
        const result = [];
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];
                let item = [..._item];
                const lastCandle = item.pop();
                const prevCandle = item[item.length - 1];
                const prePrevCandle = item[item.length - 2];
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
                const props = {
                    mAvg: 0,
                    avgUpCdlSize: 0,
                    avgDownCdlSize: 0,
                    avgUpCdlBody: 0,
                    avgDownCdlBody: 0,
                    avgHigh: 0,
                    avgLow: 0,
                    maxHigh: 0,
                    minHigh: 99999,
                    maxLow: 0,
                    minLow: 99999
                };
                const upCandlesSizes = [], downCandlesSizes = [], upCandlesBodies = [], downCandlesBodies = [];
                let sumHigh = 0, sumLow = 0, averageSum = 0;
                item.forEach((cdl) => {
                    averageSum += cdl.close;
                    if (cdl.close > cdl.open) {
                        upCandlesSizes.push(cdl.high - cdl.low);
                        upCandlesBodies.push(cdl.close - cdl.open);
                    }
                    else if (cdl.open > cdl.close) {
                        downCandlesSizes.push(cdl.high - cdl.low);
                        downCandlesBodies.push(cdl.open - cdl.close);
                    }
                    sumHigh += cdl.high;
                    sumLow += cdl.low;
                    if (cdl.high > props.maxHigh) {
                        props.maxHigh = cdl.high;
                    }
                    if (cdl.high < props.minHigh) {
                        props.minHigh = cdl.high;
                    }
                    if (cdl.low > props.maxLow) {
                        props.maxLow = cdl.low;
                    }
                    if (cdl.low < props.minLow) {
                        props.minLow = cdl.low;
                    }
                });
                props.mAvg = (averageSum + lastCandle.close) / limit;
                props.avgUpCdlSize = upCandlesSizes.reduce((a, c) => a + c, 0) / upCandlesSizes.length;
                props.avgDownCdlSize = downCandlesSizes.reduce((a, c) => a + c, 0) / downCandlesSizes.length;
                props.avgUpCdlBody = upCandlesBodies.reduce((a, c) => a + c, 0) / upCandlesBodies.length;
                props.avgDownCdlBody = downCandlesBodies.reduce((a, c) => a + c, 0) / downCandlesBodies.length;
                props.avgHigh = sumHigh / item.length;
                props.avgLow = sumLow / item.length;
                const lastCandleSize = lastCandle.high - lastCandle.low;
                if (lastCandle.close > lastCandle.open) {
                    // UP CANDLE
                    // if (lastCandleSize > props.avgUpCdlBody / 2) {
                    //     continue;
                    // }
                    let continueLoop = false;
                    for (let i = item.length - 1; i > item.length - 6; i--) {
                        const prevCdl = item[i];
                        const prevSignal = analyzeCandle(prevCdl, 'short');
                        if (prevSignal == 'stopBoth' || prevSignal == 'stopLong') {
                            continueLoop = true;
                        }
                    }
                    if (continueLoop) {
                        continue;
                    }
                    // let prevSignal = analyzeCandle(prePrevCandle, 'long');
                    // if (prevSignal == 'stopLong') {
                    //     continue;
                    // }
                    // prevSignal = analyzeCandle(prevCandle, 'long');
                    // if (prevSignal == 'stopBoth' || prevSignal == 'stopLong') {
                    //     continue;
                    // }
                    const highTail = lastCandle.high - lastCandle.close;
                    const body = lastCandle.close - lastCandle.open;
                    const lowTail = lastCandle.open - lastCandle.low;
                    if (lastCandle.low > props.mAvg /* &&
                    highTail < lowTail &&
                    body > highTail */) {
                        const stopLoss = props.mAvg;
                        // const takeProfit = lastCandle.close + (props.avgUpCdlBody - lastCandleSize);
                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100);
                        // const expectedProfit = (takeProfit - lastCandle.close) / (lastCandle.close / 100) - fee;
                        if (true) {
                            const keyResult = {
                                symbol: key,
                                position: 'long',
                                entryPrice: lastCandle.close,
                                stopLoss,
                                possibleLoss,
                                signal: 'scalping'
                            };
                            result.push(keyResult);
                        }
                    }
                }
                else if (lastCandle.open > lastCandle.close) {
                    // DOWN CANDLE
                    // if (lastCandleSize > props.avgDownCdlBody / 2) {
                    //     continue;
                    // }
                    let continueLoop = false;
                    for (let i = item.length - 1; i > item.length - 6; i--) {
                        const prevCdl = item[i];
                        const prevSignal = analyzeCandle(prevCdl, 'short');
                        if (prevSignal == 'stopBoth' || prevSignal == 'stopShort') {
                            continueLoop = true;
                        }
                    }
                    if (continueLoop) {
                        continue;
                    }
                    // let prevSignal = analyzeCandle(prePrevCandle, 'short');
                    // if (prevSignal == 'stopShort') {
                    //     continue;
                    // }
                    // prevSignal = analyzeCandle(prevCandle, 'short');
                    // if (prevSignal == 'stopBoth' || prevSignal == 'stopShort') {
                    //     continue;
                    // }
                    const highTail = lastCandle.high - lastCandle.open;
                    const body = lastCandle.open - lastCandle.close;
                    const lowTail = lastCandle.close - lastCandle.low;
                    if (lastCandle.high < props.mAvg /* &&
                    lowTail < highTail &&
                    body > lowTail */) {
                        const stopLoss = props.mAvg;
                        // const takeProfit = lastCandle.close - (props.avgDownCdlBody - lastCandleSize);
                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100);
                        // const expectedProfit = (lastCandle.close - takeProfit) / (lastCandle.close / 100) - fee;
                        if (true) {
                            const keyResult = {
                                symbol: key,
                                position: 'short',
                                entryPrice: lastCandle.close,
                                stopLoss,
                                possibleLoss,
                                signal: 'scalping'
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
exports.Scalping = Scalping;
//# sourceMappingURL=scalping.js.map