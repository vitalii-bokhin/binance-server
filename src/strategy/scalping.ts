import { ATR } from '../indicators';
import { Candle, SymbolResult, Entry } from './types';

export function Scalping({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    const _candles = candlesData;

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod });

    const prevCandle: Candle = _candles[_candles.length - 2];
    const lastCandle: Candle = _candles[_candles.length - 1];
    const lastPrice = lastCandle.close;

    const cdlMove = lastCandle.high - lastCandle.low;

    const signalDetails: any = {
        lastPrice: lastPrice,
        atr,
        moved: cdlMove / atr
    };

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        signal: 'scalping',
        strategy: 'scalping',
        preferIndex: atr / cdlMove,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };

    const stoplossRate = atr * .15;

    if (cdlMove / atr > .1 && cdlMove / atr < .3) {

        if (lastCandle.close > lastCandle.open && prevCandle.close > prevCandle.open) {

            if ((lastCandle.high - lastCandle.close) / (lastCandle.open - lastCandle.low) < .2) {
                // Long
                const stopLoss = lastPrice - stoplossRate;
                const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

                symbolResult.position = 'long';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;

            } /* else if (lastCandle.open - lastCandle.low < (lastCandle.high - lastCandle.close) / 2) {
                // Short
                const stopLoss = lastPrice + stoplossRate;
                const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

                symbolResult.position = 'short';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } */

        } else if (lastCandle.close < lastCandle.open && prevCandle.close < prevCandle.open) {

            if ((lastCandle.close - lastCandle.low) / (lastCandle.high - lastCandle.open) < .2) {
                // Short
                const stopLoss = lastPrice + stoplossRate;
                const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

                symbolResult.position = 'short';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;

            } /* else if (lastCandle.high - lastCandle.open < (lastCandle.close - lastCandle.low) / 2) {
                // Long
                const stopLoss = lastPrice - stoplossRate;
                const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

                signalDetails.stopLoss = stopLoss;
                signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

                symbolResult.position = 'long';
                symbolResult.percentLoss = percentLoss;
                symbolResult.resolvePosition = true;
            } */

        }

    }

    return symbolResult;
}