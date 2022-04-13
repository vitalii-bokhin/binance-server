// import { getTickerStreamCache } from '../binanceApi';
import { ATR, RSI, SMA } from '../indicators';
import {CheckCandle} from '../indicators/candle';
import { Candle, CdlDir, SymbolResult, Entry, Result } from './types';

// const changeDelta: {
//     [symbol: string]: {
//         lastPrice: number;
//         changePerc: number;
//         position: 'long' | 'short' | null;
//         ticks: number;
//     }
// } = {};

/* const checkRsi = function (dir: 'toLong' | 'toShort' | 'stopToLong' | 'stopToShort', rsiStack: number[]): boolean {
    if (dir == 'toLong') {
        let belowLow = false,
            toLong = false;

        rsiStack.forEach(n => {
            if (n <= 30) {
                belowLow = true;
                toLong = false;
            } else if (n > 30 && belowLow) {
                belowLow = false;
                toLong = true;
            }
        });

        return toLong;

    } else if (dir == 'stopToLong') {
        let stopLong = false;

        rsiStack.forEach(n => {
            if (n > 50) {
                stopLong = true;
            }
        });

        return stopLong;

    } else if (dir == 'toShort') {
        let aboveHigh = false,
            toShort = false;

        rsiStack.forEach(n => {
            if (n >= 70) {
                aboveHigh = true;
                toShort = false;
            } else if (n < 70 && aboveHigh) {
                aboveHigh = false;
                toShort = true;
            }
        });

        return toShort;

    } else if (dir == 'stopToShort') {
        let stopShort = false;

        rsiStack.forEach(n => {
            if (n < 50) {
                stopShort = true;
            }
        });

        return stopShort;
    }
} */

const symbChache: {
    [x: string]: {
        lastCandleOpenTime: number;
    }
} = {};

export function Scalping({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    const _candles = candlesData;

    const rsi = RSI({ data: _candles, period: tiSettings.rsiPeriod, symbol });
    const avgRsiAbove = rsi.avgRsiAbove;
    const avgRsiBelow = rsi.avgRsiBelow;

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod });

    // const rsiPerStack = rsi.stack.slice(rsiPeriod * -1);
    // const rsiAvg = rsiPerStack.reduce((p, c) => p + c, rsi.last) / (rsi.stack.length + 1);
    // const rsiShift = rsiAvg - 50;

    // console.log('rsiAvg');
    // console.log(rsiAvg);
    // console.log(rsiShift);

    const sma = SMA({ data: _candles, period: tiSettings.smaPeriod });
    const smaLag = sma.stack[sma.stack.length - tiSettings.smaPeriod / 2];
    const smaChange = Math.abs((sma.last - smaLag) / (sma.last / 100));


    const lastCandle: Candle = _candles[_candles.length - 1];
    const lastPrice = lastCandle.close;

    const prevCandle: Candle = _candles[_candles.length - 2];
    const thirdCandle: Candle = _candles[_candles.length - 3];
    const fourthCandle: Candle = _candles[_candles.length - 4];
    const fifthCandle: Candle = _candles[_candles.length - 5];

    const candles = _candles.slice(tiSettings.smaPeriod * -1);

    // const prePrevCandle: Candle = candles[candles.length - 2];

    // if (sma.last > smaLag && rsi.last > 50 && rsi.last < 70) {
    //     console.log('up');
    // } else if (sma.last < smaLag && rsi.last < 50 && rsi.last > 30) {
    //     console.log('down');
    // }


    let maxCandleMove = 0,
        minCandleMove = 9999,
        avgCandleMove = 0,
        percentAverageCandleMove = 0;

    candles.pop();

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

    minCandleMove = minCandleMove || 9999;

    avgCandleMove = avgCandleMove / candles.length;
    percentAverageCandleMove = percentAverageCandleMove / candles.length;

    const signalDetails: any = {
        lastPrice,
        rsiTopEdge: avgRsiAbove,
        rsiLast: rsi.last,
        rsiBottomEdge: avgRsiBelow,
        smaChange,
        // lastSMA: sma.last,
        percentAverageCandleMove,
        minCandleMove,
        avgCandleMove,
        lastCandleMove: lastCandle.open - lastCandle.close,
        prevCandleClose: prevCandle.close,
        // prevRsi,
        // prePrevRsi,
        atr,
        candleHasOpened: false
    };

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        signal: 'scalping',
        strategy: 'scalping',
        preferIndex: smaChange / percentAverageCandleMove,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };

    if (!symbChache[symbol]) {
        symbChache[symbol] = {
            lastCandleOpenTime: lastCandle.openTime
        };
    } else {
        if (symbChache[symbol].lastCandleOpenTime !== lastCandle.openTime) {
            signalDetails.candleHasOpened = true;
            symbChache[symbol].lastCandleOpenTime = lastCandle.openTime;
        }
    }

    /* if (rsi.last > avgRsiAbove) {

        symbChache[symbol].crossAboveRsi = true;

    } else if (rsi.last < avgRsiBelow) {

        symbChache[symbol].crossBelowRsi = true;

    } */

    /* if (
        prevRsi > avgRsiAbove &&
        rsi.last < avgRsiAbove &&
        rsi.last > 50
    ) {
        let stopLoss = lastPrice + atr;
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;

        symbChache[symbol].crossAboveRsi = false;

    } else if (
        prevRsi < avgRsiBelow &&
        rsi.last > avgRsiBelow &&
        rsi.last < 50
    ) {
        let stopLoss = lastPrice - atr;
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;

        symbChache[symbol].crossBelowRsi = false;
    } */

    // if (signalDetails.candleHasOpened) {
    //     if (
    //         (
    //             prevCandle.close > prevCandle.open &&
    //             prevCandle.high - prevCandle.low < atr * 1.5 &&
    //             // prevCandle.open > prevSma && prevCandle.close > prevSma &&
    //             CheckCandle(prevCandle, 'long') !== 'stopLong' &&
    //             CheckCandle(thirdCandle, 'long') !== 'stopLong'
    //         ) || (
    //             prevCandle.open > prevCandle.close &&
    //             prevCandle.open - prevCandle.close > atr * 1.5
    //         )
    //         /*&&
    //         thirdCandle.close > thirdCandle.open &&
    //         fourthCandle.close < fourthCandle.open  &&
    //         fifthCandle.close < fifthCandle.open */

    //     ) {
    //         const stopLoss = lastPrice - atr * .5;
    //         const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

    //         signalDetails.stopLoss = stopLoss;

    //         symbolResult.position = 'long';
    //         symbolResult.percentLoss = percentLoss;
    //         symbolResult.resolvePosition = true;

    //     } else if (
    //         (
    //             prevCandle.close < prevCandle.open &&
    //             prevCandle.high - prevCandle.low < atr * 1.5 &&
    //             // prevCandle.open < prevSma && prevCandle.close < prevSma &&
    //             CheckCandle(prevCandle, 'short') !== 'stopShort' &&
    //             CheckCandle(thirdCandle, 'short') !== 'stopShort'
    //         ) || (
    //             prevCandle.close > prevCandle.open &&
    //             prevCandle.close - prevCandle.open > atr * 1.5
    //         ) /*&&
    //         thirdCandle.close < thirdCandle.open &&
    //         fourthCandle.close > fourthCandle.open  &&
    //         fifthCandle.close > fifthCandle.open */

    //     ) {
    //         const stopLoss = lastPrice + atr * .5;
    //         const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

    //         signalDetails.stopLoss = stopLoss;

    //         symbolResult.position = 'short';
    //         symbolResult.percentLoss = percentLoss;
    //         symbolResult.resolvePosition = true;
    //     }
    // }

    /* if (smaChange < percentAverageCandleMove) {
        if (
            rsi.last >= avgRsiAbove &&
            lastCandle.close < lastCandle.open &&
            lastCandle.open - lastCandle.close >= atr
        ) {
            let stopLoss = lastPrice + atr;
            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            signalDetails.stopLoss = stopLoss;

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;

        } else if (
            rsi.last <= avgRsiBelow &&
            lastCandle.close > lastCandle.open &&
            lastCandle.close - lastCandle.open >= atr
        ) {
            let stopLoss = lastPrice - atr;
            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

            signalDetails.stopLoss = stopLoss;

            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;
        }

    } else { */
    if (
        lastPrice > sma.last &&
        prevCandle.close > sma.last &&
        prevCandle.close > prevCandle.open &&
        lastCandle.close > lastCandle.open &&
        lastCandle.close - lastCandle.open >= minCandleMove &&
        rsi.last < avgRsiAbove &&
        CheckCandle(prevCandle, 'long') !== 'stopLong'
    ) {

        let stopLoss = lastPrice - avgCandleMove;
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;


    } else if (
        lastPrice < sma.last &&
        prevCandle.close < sma.last &&
        prevCandle.close < prevCandle.open &&
        lastCandle.close < lastCandle.open &&
        lastCandle.open - lastCandle.close >= minCandleMove &&
        rsi.last > avgRsiBelow &&
        CheckCandle(prevCandle, 'short') !== 'stopShort'
    ) {

        let stopLoss = lastPrice + avgCandleMove;
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
    }
    /* } */

    return symbolResult;

    // console.log(result);


    // if (!lastCandle || !prevCandle || !prePrevCandle) {
    //     continue;
    // }

    // if (!changeDelta[symbol] && !lastCandle.isFinal) {
    //     changeDelta[symbol] = {
    //         lastPrice: lastCandle.close,
    //         changePerc: 0,
    //         position: null,
    //         ticks: 0
    //     }
    // } else if (lastCandle.isFinal) {
    //     delete changeDelta[symbol];
    // } else {
    //     const lastPrice = changeDelta[symbol].lastPrice;
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
    //         if (changeDelta[symbol].position == position) {
    //             changeDelta[symbol].changePerc += changePerc;
    //             changeDelta[symbol].ticks += 1;
    //         } else {
    //             changeDelta[symbol].changePerc = changePerc;
    //             changeDelta[symbol].position = position;
    //             changeDelta[symbol].ticks = 0;
    //         }
    //     }

    //     changeDelta[symbol].lastPrice = lastCandle.close;
    // }

    // if (changeDelta[symbol].ticks < 10) {
    //     continue;
    // }

    // const symbolResult: SymbolResult = {
    //     symbol: symbol,
    //     position: changeDelta[symbol].position,
    //     entryPrice: lastCandle.close,
    //     expectedProfit: changeDelta[symbol].changePerc,
    //     signal: 'scalping',
    //     preferIndex: changeDelta[symbol].changePerc
    // };

    // result.push(symbolResult);

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
    //     const symbolResult: SymbolResult = {
    //         symbol: symbol,
    //         position: 'long',
    //         entryPrice: lastCandle.close,
    //         percentLoss: (lastCandle.close - (lastCandle.close - props.volatility * 1.5)) / (lastCandle.close / 100),
    //         signal: 'scalping',
    //         preferIndex: props.relVolatility
    //     };

    //     result.push(symbolResult);

    // } else if (rsi.last > 60) {
    //     const symbolResult: SymbolResult = {
    //         symbol: symbol,
    //         position: 'short',
    //         entryPrice: lastCandle.close,
    //         percentLoss: ((lastCandle.close + props.volatility * 1.5) - lastCandle.close) / (lastCandle.close / 100),
    //         signal: 'scalping',
    //         preferIndex: props.relVolatility
    //     };

    //     result.push(symbolResult);
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
    //             const symbolResult: SymbolResult = {
    //                 symbol: symbol,
    //                 position: 'long',
    //                 entryPrice: lastCandle.close,
    //                 percentLoss: possibleLoss,
    //                 signal: 'scalping',
    //                 preferIndex: props.relVolatility/*  + (getTickerStreamCache(symbol) ? Number(getTickerStreamCache(symbol).percentChange) : 0) */
    //             };

    //             result.push(symbolResult);
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
    //             const symbolResult: SymbolResult = {
    //                 symbol: symbol,
    //                 position: 'short',
    //                 entryPrice: lastCandle.close,
    //                 percentLoss: possibleLoss,
    //                 signal: 'scalping',
    //                 preferIndex: props.relVolatility/*  + (getTickerStreamCache(symbol) ? Number(getTickerStreamCache(symbol).percentChange) : 0) */
    //             };

    //             result.push(symbolResult);
    //         }
    //     }
    // }
}