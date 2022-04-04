"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scalping = void 0;
const console_1 = require("../console");
const indicators_1 = require("../indicators");
const analyzeCandle = function (cdl, pos) {
    if (cdl.close >= cdl.open) {
        // UP CANDLE
        const highTail = cdl.high - cdl.close;
        const body = cdl.close - cdl.open;
        const lowTail = cdl.open - cdl.low;
        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .5) {
            return 'stopLong';
        }
        else if (pos == 'short' && lowTail / (body + highTail) > .5) {
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
        else if (pos == 'short' && lowTail / (body + highTail) > .5) {
            return 'stopShort';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .5) {
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
const checkRsi = function (dir, rsiStack) {
    if (dir == 'toLong') {
        let belowLow = false, toLong = false;
        rsiStack.forEach(n => {
            if (n <= 30) {
                belowLow = true;
                toLong = false;
            }
            else if (n > 30 && belowLow) {
                belowLow = false;
                toLong = true;
            }
        });
        return toLong;
    }
    else if (dir == 'stopToLong') {
        let stopLong = false;
        rsiStack.forEach(n => {
            if (n > 50) {
                stopLong = true;
            }
        });
        return stopLong;
    }
    else if (dir == 'toShort') {
        let aboveHigh = false, toShort = false;
        rsiStack.forEach(n => {
            if (n >= 70) {
                aboveHigh = true;
                toShort = false;
            }
            else if (n < 70 && aboveHigh) {
                aboveHigh = false;
                toShort = true;
            }
        });
        return toShort;
    }
    else if (dir == 'stopToShort') {
        let stopShort = false;
        rsiStack.forEach(n => {
            if (n < 50) {
                stopShort = true;
            }
        });
        return stopShort;
    }
};
const smaPeriod = 24;
const rsiPeriod = 9;
function Scalping({ fee, data }) {
    return new Promise((resolve, reject) => {
        const result = [];
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _candles = data[key];
                const rsi = (0, indicators_1.RSI)({ data: _candles, period: rsiPeriod });
                const avgRsiAbove = rsi.avgRsiAbove;
                const avgRsiBelow = rsi.avgRsiBelow;
                // const rsiPerStack = rsi.stack.slice(rsiPeriod * -1);
                // const rsiAvg = rsiPerStack.reduce((p, c) => p + c, rsi.last) / (rsi.stack.length + 1);
                // const rsiShift = rsiAvg - 50;
                // console.log('rsiAvg');
                // console.log(rsiAvg);
                // console.log(rsiShift);
                const sma = (0, indicators_1.SMA)({ data: _candles, period: smaPeriod });
                const smaLag = sma.stack[sma.stack.length - smaPeriod / 2];
                const smaChange = Math.abs((sma.last - smaLag) / (sma.last / 100));
                const candles = _candles.slice(smaPeriod * -1);
                const lastCandle = candles[candles.length - 1];
                const lastPrice = lastCandle.close;
                const prevCandle = candles[candles.length - 2];
                // const prePrevCandle: Candle = candles[candles.length - 2];
                // if (sma.last > smaLag && rsi.last > 50 && rsi.last < 70) {
                //     console.log('up');
                // } else if (sma.last < smaLag && rsi.last < 50 && rsi.last > 30) {
                //     console.log('down');
                // }
                let maxCandleMove = 0, minCandleMove = 9999, avgCandleMove = 0, percentAverageCandleMove = 0;
                candles.forEach(cdl => {
                    if (cdl.high - cdl.low > maxCandleMove) {
                        maxCandleMove = cdl.high - cdl.low;
                    }
                    if (cdl.high - cdl.low < minCandleMove) {
                        minCandleMove = cdl.high - cdl.low;
                    }
                    avgCandleMove += cdl.high - cdl.low;
                    percentAverageCandleMove += (cdl.high - cdl.low) / (cdl.low / 100);
                });
                avgCandleMove = avgCandleMove / candles.length;
                percentAverageCandleMove = percentAverageCandleMove / candles.length;
                const signalDetails = {
                    lastPrice,
                    rsiTopEdge: avgRsiAbove,
                    rsiLast: rsi.last,
                    rsiBottomEdge: avgRsiBelow,
                    smaChange,
                    percentAverageCandleMove
                };
                if (smaChange < percentAverageCandleMove) {
                    if (rsi.last >= avgRsiAbove) {
                        let stopLoss = lastPrice + avgCandleMove;
                        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
                        signalDetails.stopLoss = stopLoss;
                        const keyResult = {
                            symbol: key,
                            position: 'short',
                            entryPrice: lastPrice,
                            percentLoss,
                            signal: 'scalping',
                            preferIndex: percentAverageCandleMove,
                            rsiPeriod,
                            signalDetails
                        };
                        result.push(keyResult);
                    }
                    else if (rsi.last <= avgRsiBelow) {
                        let stopLoss = lastPrice - avgCandleMove;
                        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
                        signalDetails.stopLoss = stopLoss;
                        const keyResult = {
                            symbol: key,
                            position: 'long',
                            entryPrice: lastPrice,
                            percentLoss,
                            signal: 'scalping',
                            preferIndex: percentAverageCandleMove,
                            rsiPeriod,
                            signalDetails
                        };
                        result.push(keyResult);
                    }
                }
                else {
                    if (lastPrice > sma.last &&
                        prevCandle.close > sma.last &&
                        lastCandle.close > lastCandle.open &&
                        lastCandle.close - lastCandle.open >= minCandleMove &&
                        rsi.last < avgRsiAbove) {
                        // console.log('long');
                        // let stopLoss = sma.last;
                        let stopLoss = lastPrice - avgCandleMove;
                        // if (lastPrice - stopLoss < maxCandleMove) {
                        //     stopLoss = lastPrice - maxCandleMove;
                        // }
                        // console.log(stopLoss);
                        signalDetails.stopLoss = stopLoss;
                        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
                        const keyResult = {
                            symbol: key,
                            position: 'long',
                            entryPrice: lastPrice,
                            percentLoss,
                            signal: 'scalping',
                            preferIndex: percentAverageCandleMove,
                            rsiPeriod,
                            signalDetails
                        };
                        result.push(keyResult);
                    }
                    else if (lastPrice < sma.last &&
                        prevCandle.close < sma.last &&
                        lastCandle.close < lastCandle.open &&
                        lastCandle.open - lastCandle.close >= minCandleMove &&
                        rsi.last > avgRsiBelow) {
                        // console.log('short');
                        // let stopLoss = sma.last;
                        let stopLoss = lastPrice + avgCandleMove;
                        // if (stopLoss - lastPrice < maxCandleMove) {
                        //     stopLoss = lastPrice + maxCandleMove;
                        // }
                        // console.log(stopLoss);
                        signalDetails.stopLoss = stopLoss;
                        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
                        const keyResult = {
                            symbol: key,
                            position: 'short',
                            entryPrice: lastPrice,
                            percentLoss,
                            signal: 'scalping',
                            preferIndex: percentAverageCandleMove,
                            rsiPeriod,
                            signalDetails
                        };
                        result.push(keyResult);
                    }
                }
                (0, console_1.consoleLog)({ ['signalDetails_' + key]: signalDetails });
                // console.log(result);
                // if (!lastCandle || !prevCandle || !prePrevCandle) {
                //     continue;
                // }
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
                // let lagCandlesStack = candles.slice(-36, -12);
                // let candlesStack = candles.slice(-24);
                // const props = {
                //     lagMAvg: 0,
                //     MAvg: 0,
                //     volatility: 0,
                //     relVolatility: 0,
                //     avgUpCdlSize: 0,
                //     avgDownCdlSize: 0,
                //     avgUpCdlBody: 0,
                //     avgDownCdlBody: 0,
                //     avgHigh: 0,
                //     avgLow: 0,
                //     maxHigh: 0,
                //     minHigh: 99999,
                //     maxLow: 0,
                //     minLow: 99999
                // };
                // console.log(lagCandlesStack.length);
                // const lagMAvg: any = lagCandlesStack.reduce((pr, cur): any => {
                //     return { close: pr.close + cur.close };
                // });
                // props.lagMAvg = lagMAvg.close / lagCandlesStack.length;
                // const MAvg: any = candlesStack.reduce((pr, cur): any => {
                //     return { close: pr.close + cur.close };
                // });
                // props.MAvg = (MAvg.close + lastCandle.close) / (candlesStack.length + 1);
                // const upCandlesSizes: number[] = [],
                //     downCandlesSizes: number[] = [],
                //     upCandlesBodies: number[] = [],
                //     downCandlesBodies: number[] = [];
                // let sumHigh = 0,
                //     sumLow = 0,
                //     volatilitySum = 0,
                //     relVolatilitySum = 0;
                // candlesStack.forEach((cdl: Candle): void => {
                //     volatilitySum += cdl.high - cdl.low;
                //     relVolatilitySum += (cdl.high - cdl.low) / (cdl.low / 100);
                //     if (cdl.close > cdl.open) {
                //         upCandlesSizes.push(cdl.high - cdl.low);
                //         upCandlesBodies.push(cdl.close - cdl.open);
                //     } else if (cdl.open > cdl.close) {
                //         downCandlesSizes.push(cdl.high - cdl.low);
                //         downCandlesBodies.push(cdl.open - cdl.close);
                //     }
                //     sumHigh += cdl.high;
                //     sumLow += cdl.low;
                //     if (cdl.high > props.maxHigh) {
                //         props.maxHigh = cdl.high;
                //     }
                //     if (cdl.high < props.minHigh) {
                //         props.minHigh = cdl.high;
                //     }
                //     if (cdl.low > props.maxLow) {
                //         props.maxLow = cdl.low;
                //     }
                //     if (cdl.low < props.minLow) {
                //         props.minLow = cdl.low;
                //     }
                // });
                // props.volatility = volatilitySum / candlesStack.length;
                // props.relVolatility = relVolatilitySum / candlesStack.length;
                // props.avgUpCdlSize = upCandlesSizes.reduce((a, c) => a + c, 0) / upCandlesSizes.length;
                // props.avgDownCdlSize = downCandlesSizes.reduce((a, c) => a + c, 0) / downCandlesSizes.length;
                // props.avgUpCdlBody = upCandlesBodies.reduce((a, c) => a + c, 0) / upCandlesBodies.length;
                // props.avgDownCdlBody = downCandlesBodies.reduce((a, c) => a + c, 0) / downCandlesBodies.length;
                // props.avgHigh = sumHigh / candlesStack.length;
                // props.avgLow = sumLow / candlesStack.length;
                // const lastCandleSize = lastCandle.high - lastCandle.low;
                // if (rsi.last < 40) {
                //     const keyResult: SymbolResult = {
                //         symbol: key,
                //         position: 'long',
                //         entryPrice: lastCandle.close,
                //         percentLoss: (lastCandle.close - (lastCandle.close - props.volatility * 1.5)) / (lastCandle.close / 100),
                //         signal: 'scalping',
                //         preferIndex: props.relVolatility
                //     };
                //     result.push(keyResult);
                // } else if (rsi.last > 60) {
                //     const keyResult: SymbolResult = {
                //         symbol: key,
                //         position: 'short',
                //         entryPrice: lastCandle.close,
                //         percentLoss: ((lastCandle.close + props.volatility * 1.5) - lastCandle.close) / (lastCandle.close / 100),
                //         signal: 'scalping',
                //         preferIndex: props.relVolatility
                //     };
                //     result.push(keyResult);
                // }
                // if (lastCandle.close > lastCandle.open) {
                //     // UP CANDLE
                //     // if (props.MAvg < props.lagMAvg) {
                //     //     continue;
                //     // }
                //     // if (lastCandleSize > props.avgUpCdlBody / 2) {
                //     //     continue;
                //     // }
                //     // let continueLoop = false;
                //     // for (let i = candlesStack.length - 1; i > candlesStack.length - 6; i--) {
                //     //     const prevCdl = item[i];
                //     //     const prevSignal = analyzeCandle(prevCdl, 'short');
                //     //     if (prevSignal == 'stopBoth' || prevSignal == 'stopLong') {
                //     //         continueLoop = true;
                //     //     }
                //     // }
                //     // if (continueLoop) {
                //     //     continue;
                //     // }
                //     // let prevSignal = analyzeCandle(prePrevCandle, 'long');
                //     // if (prevSignal == 'stopLong') {
                //     //     continue;
                //     // }
                //     // const prevSignal = analyzeCandle(prevCandle, 'long');
                //     // if (prevSignal == 'stopBoth' || prevSignal == 'stopLong') {
                //     //     continue;
                //     // }
                //     const highTail = lastCandle.high - lastCandle.close;
                //     const body = lastCandle.close - lastCandle.open;
                //     const lowTail = lastCandle.open - lastCandle.low;
                //     if (highTail < lowTail && body > highTail) {
                //         let stopLoss: number;
                //         if (
                //             rsi.last < 40
                //             // lastCandle.open > props.MAvg &&
                //             // rsi.last > 50 && rsi.last < 60 &&
                //             // !checkRsi('stopToLong', rsiStack)
                //         ) {
                //             // stopLoss = props.MAvg;
                //             // const takeProfit = lastCandle.close + (props.avgUpCdlBody - lastCandleSize);
                //             // if (lastCandle.close - props.volatility < stopLoss) {
                //             //     stopLoss = lastCandle.close - props.volatility;
                //             // }
                //             stopLoss = lastCandle.close - props.volatility * 2;
                //         } /* else if (checkRsi('toLong', rsiStack) && rsi.last > 30 && rsi.last < 40) {
                //             stopLoss = lastCandle.close - props.volatility;
                //         } */
                //         const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100);
                //         // const expectedProfit = (takeProfit - lastCandle.close) / (lastCandle.close / 100) - fee;
                //         if (stopLoss) {
                //             const keyResult: SymbolResult = {
                //                 symbol: key,
                //                 position: 'long',
                //                 entryPrice: lastCandle.close,
                //                 percentLoss: possibleLoss,
                //                 signal: 'scalping',
                //                 preferIndex: props.relVolatility/*  + (getTickerStreamCache(key) ? Number(getTickerStreamCache(key).percentChange) : 0) */
                //             };
                //             result.push(keyResult);
                //         }
                //     }
                // } else if (lastCandle.open > lastCandle.close) {
                //     // DOWN CANDLE
                //     // if (props.MAvg > props.lagMAvg) {
                //     //     continue;
                //     // }
                //     // if (lastCandleSize > props.avgDownCdlBody / 2) {
                //     //     continue;
                //     // }
                //     // let continueLoop = false;
                //     // for (let i = candlesStack.length - 1; i > candlesStack.length - 6; i--) {
                //     //     const prevCdl = item[i];
                //     //     const prevSignal = analyzeCandle(prevCdl, 'short');
                //     //     if (prevSignal == 'stopBoth' || prevSignal == 'stopShort') {
                //     //         continueLoop = true;
                //     //     }
                //     // }
                //     // if (continueLoop) {
                //     //     continue;
                //     // }
                //     // let prevSignal = analyzeCandle(prePrevCandle, 'short');
                //     // if (prevSignal == 'stopShort') {
                //     //     continue;
                //     // }
                //     // const prevSignal = analyzeCandle(prevCandle, 'short');
                //     // if (prevSignal == 'stopBoth' || prevSignal == 'stopShort') {
                //     //     continue;
                //     // }
                //     const highTail = lastCandle.high - lastCandle.open;
                //     const body = lastCandle.open - lastCandle.close;
                //     const lowTail = lastCandle.close - lastCandle.low;
                //     if (lowTail < highTail && body > lowTail) {
                //         let stopLoss: number;
                //         if (
                //             rsi.last > 60
                //             /*lastCandle.open < props.MAvg &&
                //             rsi.last < 50 && rsi.last > 40  &&
                //             !checkRsi('stopToShort', rsiStack) */
                //         ) {
                //             // stopLoss = props.MAvg;
                //             // const takeProfit = lastCandle.close - (props.avgDownCdlBody - lastCandleSize);
                //             // if (lastCandle.close + props.volatility > stopLoss) {
                //             //     stopLoss = lastCandle.close + props.volatility;
                //             // }
                //             stopLoss = lastCandle.close + props.volatility * 2;
                //         } /* else if (checkRsi('toShort', rsiStack) && rsi.last < 70 && rsi.last > 60) {
                //             stopLoss = lastCandle.close + props.volatility;
                //         } */
                //         const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100);
                //         if (stopLoss) {
                //             const keyResult: SymbolResult = {
                //                 symbol: key,
                //                 position: 'short',
                //                 entryPrice: lastCandle.close,
                //                 percentLoss: possibleLoss,
                //                 signal: 'scalping',
                //                 preferIndex: props.relVolatility/*  + (getTickerStreamCache(key) ? Number(getTickerStreamCache(key).percentChange) : 0) */
                //             };
                //             result.push(keyResult);
                //         }
                //     }
                // }
            }
        }
        resolve(result);
    });
}
exports.Scalping = Scalping;
//# sourceMappingURL=scalping.js.map