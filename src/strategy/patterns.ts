import { Candle, SymbolResult, Entry } from './types';

const splitCdl = function (cdl: Candle): { highTail: number; body: number; lowTail: number; } {
    let highTail: number,
        body: number,
        lowTail: number;

    if (cdl.close > cdl.open) {
        highTail = cdl.high - cdl.close;
        body = cdl.close - cdl.open;
        lowTail = cdl.open - cdl.low;

    } else if (cdl.close < cdl.open) {
        highTail = cdl.high - cdl.open;
        body = cdl.open - cdl.close;
        lowTail = cdl.close - cdl.low;
    }

    return {
        highTail,
        body,
        lowTail
    };
}

export function Patterns({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }: Entry): SymbolResult {
    const _candles = candlesData;

    const thirdCandle: Candle = _candles.slice(-3)[0];
    const prevCandle: Candle = _candles.slice(-2)[0];
    const lastCandle: Candle = _candles.slice(-1)[0];

    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'patterns',
        preferIndex: null,
        rsiPeriod: tiSettings.rsiPeriod,
        resolvePosition: false
    };

    const long = function (stopLoss) {
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        symbolResult.resolvePosition = true;
    }

    const short = function (stopLoss) {
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.preferIndex = 100 - percentLoss;
        symbolResult.resolvePosition = true;
    }

    const prevCdlSplit = splitCdl(prevCandle);

    if ( // hummer
        prevCdlSplit.highTail < prevCdlSplit.body
        && prevCdlSplit.lowTail > prevCdlSplit.body * 2
        && prevCandle.high < thirdCandle.high
        && prevCandle.high > thirdCandle.low
        && lastCandle.close > lastCandle.open
    ) {
        long(prevCandle.low);

    } else if ( // shooting star
        prevCdlSplit.highTail > prevCdlSplit.body * 2
        && prevCdlSplit.lowTail < prevCdlSplit.body
        && prevCandle.low > thirdCandle.low
        && prevCandle.low < thirdCandle.high
        && lastCandle.close < lastCandle.open
    ) {
        short(prevCandle.high);

    } else if ( // hanging man
        prevCdlSplit.highTail < prevCdlSplit.body
        && prevCdlSplit.lowTail > prevCdlSplit.body * 2
        && prevCandle.high > thirdCandle.high
        && prevCandle.low < thirdCandle.high
        && lastCandle.close < lastCandle.open
    ) {
        short(prevCandle.high);

    } else if ( // rev hummer
        prevCdlSplit.highTail > prevCdlSplit.body * 2
        && prevCdlSplit.lowTail < prevCdlSplit.body
        && prevCandle.low < thirdCandle.low
        && prevCandle.high > thirdCandle.low
        && lastCandle.close > lastCandle.open
    ) {
        long(prevCandle.low);

    } else if ( // spinning top long
        prevCdlSplit.highTail > prevCdlSplit.body * 2
        && prevCdlSplit.lowTail > prevCdlSplit.body * 2
        && thirdCandle.close < thirdCandle.open
        && lastCandle.close > lastCandle.open
        && lastPrice > prevCandle.high
    ) {
        long(prevCandle.low);

    } else if ( // spinning top short
        prevCdlSplit.highTail > prevCdlSplit.body * 2
        && prevCdlSplit.lowTail > prevCdlSplit.body * 2
        && thirdCandle.close > thirdCandle.open
        && lastCandle.close < lastCandle.open
        && lastPrice < prevCandle.low
    ) {
        short(prevCandle.high);
    }



    if (symbolResult.resolvePosition) {
        console.log(symbolResult);
    }

    return symbolResult;
}