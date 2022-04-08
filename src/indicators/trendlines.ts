import { InputTime, TradelinesInput, TradelinesResult } from './types';

const getTime = function ({ d, h, m }: InputTime): number {
    return new Date(2022, 3, d, h, m).getTime();
}

const priceOnLine = function (line: { price: number; time: InputTime; }[], time: number): number {
    return ((time - getTime(line[0].time)) / (getTime(line[0].time) - getTime(line[1].time))) * (line[0].price - line[1].price) + line[0].price;
}

export function TDL({ candles, topLineOpt, bottomLineOpt }: TradelinesInput): TradelinesResult {
    const prevCdl = candles[candles.length - 2];
    const lastCdl = candles[candles.length - 1];

    const prevTopLinePrice = priceOnLine(topLineOpt, prevCdl.openTime);
    const prevBottomLinePrice = priceOnLine(bottomLineOpt, prevCdl.openTime);

    const lastTopLinePrice = priceOnLine(topLineOpt, lastCdl.openTime);
    const lastBottomLinePrice = priceOnLine(bottomLineOpt, lastCdl.openTime);

    console.log(prevCdl);
    console.log(prevTopLinePrice);
    console.log(prevBottomLinePrice);

    let signal = null;

    if (
        prevCdl.open < prevTopLinePrice &&
        prevCdl.close > prevTopLinePrice &&
        lastCdl.close > lastTopLinePrice
    ) {
        signal = 'crossAboveTop';

    } else if (
        prevCdl.open > prevTopLinePrice &&
        prevCdl.close < prevTopLinePrice &&
        lastCdl.close < lastTopLinePrice
    ) {
        signal = 'crossBelowTop';

    } else if (
        prevCdl.open > prevBottomLinePrice &&
        prevCdl.close < prevBottomLinePrice &&
        lastCdl.close < lastBottomLinePrice
    ) {
        signal = 'crossBelowBottom';

    } else if (
        prevCdl.open < prevBottomLinePrice &&
        prevCdl.close > prevBottomLinePrice &&
        lastCdl.close > lastBottomLinePrice
    ) {
        signal = 'crossAboveBottom';

    } else if (
        prevCdl.high >= prevTopLinePrice &&
        // prevCdl.close < prevTopLinePrice &&
        prevCdl.open < prevTopLinePrice &&
        lastCdl.close < lastTopLinePrice
    ) {
        signal = 'underTop';

    } else if (
        prevCdl.low <= prevBottomLinePrice &&
        // prevCdl.close > prevBottomLinePrice &&
        prevCdl.open > prevBottomLinePrice &&
        lastCdl.close > lastBottomLinePrice
    ) {
        signal = 'overBottom';

    } else if (
        prevCdl.low <= prevTopLinePrice &&
        // prevCdl.close > prevTopLinePrice &&
        prevCdl.open > prevTopLinePrice &&
        lastCdl.close > lastTopLinePrice
    ) {
        signal = 'overTop';

    } else if (
        prevCdl.high >= prevBottomLinePrice &&
        // prevCdl.close < prevBottomLinePrice &&
        prevCdl.open < prevBottomLinePrice &&
        lastCdl.close < lastBottomLinePrice
    ) {
        signal = 'underBottom';
    }

    console.log(signal);

    return {
        signal,
        topLinePrice: lastTopLinePrice,
        bottomLinePrice: lastBottomLinePrice
    };
}