import { Candle, InputTime, LevelInput, LevelOpt, TrendlineInput } from './types';
type Signal = 'onLevel' | 'nextToTop' | 'nextToBottom' | 'cuddleTop' | 'cuddleBottom' | 'retestBottom' | 'retestTop';

type Result = {
    topPrice: number;
    bottomPrice: number;
    signal: Signal;
    direction: 'up' | 'down';
};

let i = 0;

export function LVL({ candles, levelsOpt }: LevelInput): Result {
    let signal: Signal,
        topPrice: number,
        bottomPrice: number,
        direction: 'up' | 'down';

    // const _candles = candles.slice(-3);
    const _candles = candles.slice(-3, -1);
    const lastPrice = candles.slice(-1)[0].close;
    // const prePrevCdl = _candles[0];
    // const prevCdl = _candles[1];

    // const nearLvl = {
    //     price: null,
    //     dist: 99999
    // };

    const nearLvl = levelsOpt.reduce((p, c) => p.concat(c.price), [])
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

        const lvlPrice = [...level.price];

        if (lvlPrice[0] > lvlPrice[1]) {
            direction = 'up';
        } else {
            direction = 'down';
        }

        lvlPrice.sort((a, b) => b - a);

        const topLvl = lvlPrice[0];
        const btmLvl = lvlPrice[1];

        topPrice = topLvl;
        bottomPrice = btmLvl;

        // if (
        //     lastCandle.high > btmLvl
        //     && lastCandle.low < topLvl
        // ) {
        //     signal = 'onLevel';
        // }

        for (const cdl of _candles) {
            if (
                cdl.high >= btmLvl
                && cdl.low <= topLvl
            ) {
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

        if (signal && level.price.includes(nearLvl)) {
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

    return { signal, topPrice, bottomPrice, direction };
}