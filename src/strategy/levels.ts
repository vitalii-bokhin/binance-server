import { LVL, TDL } from '../indicators';
import { Candle, SymbolResult, Entry } from './types';
let i = 0, j = 0;
export function Levels({ symbol, candlesData, tiSettings, levelsOpt, trendsOpt }: Entry): SymbolResult {
    const _candles = candlesData;

    const tdl = TDL({ candles: _candles, trendsOpt });
    const lvl = LVL({ candles: _candles, levelsOpt });

    const lastCandle: Candle = _candles.slice(-1)[0];

    const lastPrice = lastCandle.close;

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        strategy: 'levels',
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

    if (lvl.signal == 'onLevel') {
        console.log(symbol);
        console.log(lvl);
        console.log(i++);

        if (
            lvl.direction == 'up'
            && lastPrice > lvl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.low < lvl.topPrice
        ) {
            long(lvl.bottomPrice);

        } else if (
            lvl.direction == 'down'
            && lastPrice < lvl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.high > lvl.bottomPrice
        ) {
            short(lvl.topPrice);
        }

    } else if (tdl.signal == 'onTrend') {
        console.log(symbol);
        console.log(tdl);
        console.log(j++);

        if (
            tdl.direction == 'up'
            && lastPrice > tdl.topPrice
            && lastCandle.close > lastCandle.open
            && lastCandle.low < tdl.topPrice
        ) {
            long(lvl.bottomPrice);

        } else if (
            tdl.direction == 'down'
            && lastPrice < tdl.bottomPrice
            && lastCandle.close < lastCandle.open
            && lastCandle.high > tdl.bottomPrice
        ) {
            short(tdl.topPrice);
        }
    }

    console.log(symbolResult.position);

    return symbolResult;
}