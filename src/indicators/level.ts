import { Candle, InputTime, LevelInput, LevelOpt, LineOpt, TrendlineInput } from './types';
type Signal = 'nextToTop' | 'nextToBottom' | 'cuddleTop' | 'cuddleBottom' | 'retestBottom' | 'retestTop';

type Result = {
    topPrice: number;
    bottomPrice: number;
    signal: Signal;
};
let i = 0;
export function LVL({ candles, levelsOpt }: LevelInput): Result {
    let signal: Signal,
        topPrice: number,
        bottomPrice: number;

    const _candles = candles.slice(-3);

    const prePrevCdl = _candles[0];
    const prevCdl = _candles[1];

    for (const level of levelsOpt) {
        signal = null;
        topPrice = null;
        bottomPrice = null;

        const lvlPrice = [...level.price];

        lvlPrice.sort((a, b) => b - a);

        const topLvl = lvlPrice[0];
        const btmLvl = lvlPrice[1];

        if (
            // prePrevCdl.low < prevCdl.low
            // && prePrevCdl.low < btmLvl
            // && prevCdl.high > btmLvl
            prevCdl.open < btmLvl
            && prevCdl.high > btmLvl
        ) {
            signal = 'nextToBottom';

        } else if (
            // prePrevCdl.high > prevCdl.high
            // && prePrevCdl.high > topLvl
            // && prevCdl.low < topLvl
            prevCdl.open > topLvl
            && prevCdl.low < topLvl
        ) {
            signal = 'nextToTop';
        }

        if (signal) {
            const cdlsStack = candles.slice(-24, -2);

            cdlsStack.reverse();

            let cuddle = null;
            let retest = null;

            for (const cdl of cdlsStack) {
                if (signal == 'nextToBottom') {
                    if (cdl.high >= btmLvl) {
                        cuddle = 'cuddleBottom';
                    }

                } else if (signal == 'nextToTop') {
                    if (cdl.low <= topLvl) {
                        cuddle = 'cuddleTop';
                    }
                }

                if (cuddle == 'cuddleBottom') {
                    if (cdl.low > topLvl) {
                        retest = 'retestBottom';
                    }

                } else if (cuddle == 'cuddleTop') {
                    if (cdl.high < btmLvl) {
                        retest = 'retestTop';
                    }
                }
            }

            if (retest) {
                signal = retest;
            } else if (cuddle) {
                signal = cuddle;
            }

            topPrice = topLvl;
            bottomPrice = btmLvl;
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

    return { signal, topPrice, bottomPrice };
}