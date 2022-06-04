"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LVL = void 0;
let i = 0;
function LVL({ candles, levelsOpt }) {
    let signal, topPrice, bottomPrice, mainPrice, direction;
    // const _candles = candles.slice(-3);
    const _candles = candles.slice(-3, -1);
    const lastPrice = candles.slice(-1)[0].close;
    // const prePrevCdl = _candles[0];
    // const prevCdl = _candles[1];
    // const nearLvl = {
    //     price: null,
    //     dist: 99999
    // };
    const nearLvl = levelsOpt
        .map(it => it.price[0])
        .sort((a, b) => Math.abs(lastPrice - a) - Math.abs(lastPrice - b))[0];
    // for (const level of levelsOpt) {
    //     for (const price of level.price) {
    //         const dist = Math.abs(lastPrice - price);
    //         if (dist < nearLvl.dist) {
    //             nearLvl.dist = dist;
    //             nearLvl.price = price;
    //         }
    //     }
    // }
    for (const level of levelsOpt) {
        signal = null;
        topPrice = null;
        bottomPrice = null;
        direction = null;
        mainPrice = level.price[0];
        const lvlEdges = [
            level.price[1],
            level.price[0] + (level.price[0] - level.price[1])
        ];
        if (level.price[0] > level.price[1]) {
            direction = 'up';
        }
        else {
            direction = 'down';
        }
        lvlEdges.sort((a, b) => b - a);
        const topLvl = lvlEdges[0];
        const btmLvl = lvlEdges[1];
        topPrice = topLvl;
        bottomPrice = btmLvl;
        // if (
        //     lastCandle.high > btmLvl
        //     && lastCandle.low < topLvl
        // ) {
        //     signal = 'onLevel';
        // }
        for (const cdl of _candles) {
            if (cdl.high >= mainPrice
                && cdl.low <= mainPrice) {
                signal = 'onLevel';
            }
        }
        // for (const cdl of _candles) {
        //     if (
        //         cdl.open < btmLvl
        //         && cdl.high > btmLvl
        //     ) {
        //         signal = 'nextToBottom';
        //     } else if (
        //         cdl.open > topLvl
        //         && cdl.low < topLvl
        //     ) {
        //         signal = 'nextToTop';
        //     }
        // }
        // if (
        //     // prePrevCdl.low < prevCdl.low
        //     // && prePrevCdl.low < btmLvl
        //     // && prevCdl.high > btmLvl
        //     prevCdl.open < btmLvl
        //     && prevCdl.high > btmLvl
        // ) {
        //     signal = 'nextToBottom';
        // } else if (
        //     // prePrevCdl.high > prevCdl.high
        //     // && prePrevCdl.high > topLvl
        //     // && prevCdl.low < topLvl
        //     prevCdl.open > topLvl
        //     && prevCdl.low < topLvl
        // ) {
        //     signal = 'nextToTop';
        // }
        if (signal && mainPrice === nearLvl) {
            // const cdlsStack = candles.slice(-24, -2);
            // cdlsStack.reverse();
            // let cuddle = null;
            // let retest = null;
            // for (const cdl of cdlsStack) {
            //     if (signal == 'nextToBottom') {
            //         if (cdl.high >= btmLvl) {
            //             cuddle = 'cuddleBottom';
            //         }
            //     } else if (signal == 'nextToTop') {
            //         if (cdl.low <= topLvl) {
            //             cuddle = 'cuddleTop';
            //         }
            //     }
            //     if (cuddle == 'cuddleBottom') {
            //         if (cdl.low > topLvl) {
            //             retest = 'retestBottom';
            //         }
            //     } else if (cuddle == 'cuddleTop') {
            //         if (cdl.high < btmLvl) {
            //             retest = 'retestTop';
            //         }
            //     }
            // }
            // if (retest) {
            //     signal = retest;
            // } else if (cuddle) {
            //     signal = cuddle;
            // }
            // console.log(signal);
            // console.log(i++);
            break;
        }
        // if (signal) {
        //     // console.log(topPrice, bottomPrice);
        //     // console.log(prePrevCdl);
        //     // console.log(prevCdl);
        // }
    }
    // if (prevSignal == 'nextToBottom') {
    //     if (prevCdl.close < topLvlPrice) {
    //         prevSignal = 'bounceDown';
    //     } else {
    //         prevSignal = 'crossAbove';
    //     }
    // } else if (prevSignal == 'nextToTop') {
    //     if (prevCdl.close > bottomLvlPrice) {
    //         prevSignal = 'bounceUp';
    //     } else {
    //         prevSignal = 'crossBelow';
    //     }
    // }
    // if (
    //     (prevSignal == 'bounceDown' || prevSignal == 'crossBelow')
    //     && curCdl.close < bottomLvlPrice
    //     && curCdl.close < curCdl.open
    // ) {
    //     signal = prevSignal;
    // } else if (
    //     (signal == 'bounceUp' || signal == 'crossAbove')
    //     && curCdl.close > topLvlPrice
    //     && curCdl.close > curCdl.open
    // ) {
    //     signal = prevSignal;
    // } else {
    //     signal = null;
    // }
    return { signal, topPrice, mainPrice, bottomPrice, direction };
}
exports.LVL = LVL;
//# sourceMappingURL=level.js.map