import { Candle, InputTime, LevelInput, LevelOpt, LineOpt, TrendlineInput } from './types';

type PrelSignal = 'overLine' | 'underLine' | 'nextToLine' | 'nextToTop' | 'nextToBottom' | 'crossBelow' | 'crossAbove' | 'bounceUp' | 'bounceDown';

type Signal = 'bounceUp' | 'bounceDown' | 'crossAbove' | 'crossBelow';

const cache: {
    [symbol: string]: {
        prelSignal: PrelSignal;
        openTime: number;
    };
} = {};

// const getPrelSignal = function (cdl: Candle, levelOpt: LevelOpt, prelSignal: PrelSignal): PrelSignal {
//     const priceOnLine = levelOpt.price;
//     const spread = levelOpt.spread;

//     let signal: PrelSignal;

//     if (cdl.close > priceOnLine + spread) {
//         signal = 'overLine';
//     } else if (cdl.close < priceOnLine - spread) {
//         signal = 'underLine';
//     } else if (cdl.close < priceOnLine + spread && cdl.close < cdl.open) {
//         signal = 'nextToTop';
//     } else if (cdl.close > priceOnLine - spread && cdl.close > cdl.open) {
//         signal = 'nextToBottom';
//     }

//     if (prelSignal == 'overLine') {
//         if (cdl.close < priceOnLine - spread) {
//             signal = 'crossBelow';
//         } else if (cdl.close < priceOnLine + spread) {
//             signal = 'nextToTop';
//         }
//     } else if (prelSignal == 'underLine') {
//         if (cdl.close > priceOnLine + spread) {
//             signal = 'crossAbove';
//         } else if (cdl.close > priceOnLine - spread) {
//             signal = 'nextToBottom';
//         }
//     }

//     if (prelSignal == 'nextToTop') {
//         if (cdl.close > priceOnLine + spread) {
//             signal = 'bounceUp';
//         } else if (cdl.close < priceOnLine - spread) {
//             signal = 'crossBelow';
//         } else {
//             signal = 'nextToTop';
//         }

//     } else if (prelSignal == 'nextToBottom') {
//         if (cdl.close < priceOnLine - spread) {
//             signal = 'bounceDown';
//         } else if (cdl.close > priceOnLine + spread) {
//             signal = 'crossAbove';
//         } else {
//             signal = 'nextToBottom';
//         }
//     }

//     if (prelSignal == 'crossAbove') {
//         if (cdl.close < priceOnLine + spread) {
//             signal = 'nextToBottom';
//         }

//     } else if (prelSignal == 'crossBelow') {
//         if (cdl.close > priceOnLine - spread) {
//             signal = 'nextToTop';
//         }
//     }

//     if (prelSignal == 'bounceUp') {
//         if (cdl.close < priceOnLine + spread) {
//             signal = 'nextToTop';
//         }

//     } else if (prelSignal == 'bounceDown') {
//         if (cdl.close > priceOnLine - spread) {
//             signal = 'nextToBottom';
//         }
//     }

//     return signal;
// }

// const getSignal = function (cdl: Candle, levelOpt: LevelOpt, prelSignal: PrelSignal): Signal {
//     const priceOnLine = levelOpt.price;
//     const spread = levelOpt.spread;

//     let signal: Signal;

//     if (prelSignal == 'bounceUp' && cdl.close > cdl.open) {
//         signal = 'bounceUp';
//     } else if (prelSignal == 'bounceDown' && cdl.close < cdl.open) {
//         signal = 'bounceDown';
//     } else if (prelSignal == 'crossAbove' && cdl.close > cdl.open) {
//         signal = 'crossAbove';
//     } else if (prelSignal == 'crossBelow' && cdl.close < cdl.open) {
//         signal = 'crossBelow';
//     }

//     return signal;
// }
const getSignal = function (cdl: Candle, levelOpt: LevelOpt): PrelSignal {
    const priceOnLine = levelOpt.price;
    const spread = levelOpt.spread;

    let signal: PrelSignal;

    if (cdl.close > priceOnLine - spread && cdl.low < priceOnLine - spread) {
        signal = 'nextToBottom';
    } else if (cdl.close < priceOnLine + spread && cdl.high > priceOnLine + spread) {
        signal = 'nextToTop';
    }

    if (cdl.close > priceOnLine + spread && cdl.low < priceOnLine - spread) {
        signal = 'crossAbove';
    } else if (cdl.close < priceOnLine - spread && cdl.high > priceOnLine + spread) {
        signal = 'crossBelow';
    }

    return signal;
}

export function LVL({ symbol, candles, levelOpt }: LevelInput): { signal: Signal; clearChache: () => void; } {
    if (!cache[symbol]) {
        cache[symbol] = {
            prelSignal: null,
            openTime: null
        };
    }

    let signal: Signal;

    // const _candles = candles.slice(-31);
    const lastCdl = candles[candles.length - 2];
    const curCdl = candles[candles.length - 1];

    // if (curCdl.openTime !== cache[symbol].openTime) {
    //     // _candles.forEach(cdl => {
    //     //     cache[symbol].prelSignal = getPrelSignal(cdl, levelOpt, cache[symbol].prelSignal);
    //     //     console.log(cache[symbol].prelSignal);
    //     // });

    //     cache[symbol].openTime = curCdl.openTime;
    // }

    const clearChache = function () {
        cache[symbol].prelSignal = null;
    }

    // const confirmSignal = getSignal(lastCdl, levelOpt, cache[symbol].prelSignal);
    const sign = getSignal(lastCdl, levelOpt);

    cache[symbol].prelSignal = sign || cache[symbol].prelSignal;

    // console.log('confirm', confirmSignal);

    // if (
    //     (confirmSignal == 'bounceUp' || confirmSignal == 'crossAbove') &&
    //     curCdl.close > curCdl.open
    // ) {
    //     signal = confirmSignal;
    // } else if (
    //     (confirmSignal == 'bounceDown' || confirmSignal == 'crossBelow') &&
    //     curCdl.close < curCdl.open
    // ) {
    //     signal = confirmSignal;
    // }

    if (
        cache[symbol].prelSignal == 'nextToBottom' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread
    ) {
        signal = 'bounceDown';
    } else if (
        cache[symbol].prelSignal == 'nextToTop' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price - levelOpt.spread
    ) {
        signal = 'bounceUp';
    } else if (
        cache[symbol].prelSignal == 'crossBelow' &&
        curCdl.close < curCdl.open &&
        curCdl.close < levelOpt.price - levelOpt.spread
    ) {
        signal = 'crossBelow';
    } else if (
        cache[symbol].prelSignal == 'crossAbove' &&
        curCdl.close > curCdl.open &&
        curCdl.close > levelOpt.price - levelOpt.spread
    ) {
        signal = 'crossAbove';
    }

    // console.log('signal', signal);

    return { signal, clearChache };
}