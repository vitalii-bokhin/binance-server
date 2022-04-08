import { getTickerStreamCache } from '../binanceApi';
import { ATR, RSI, SMA, TDL } from '../indicators';
import analizeCandle from '../indicators/candle';
import { Candle, CdlDir, SymbolResult, Entry, Result } from './types';

export function Aisle({ symbol, candlesData, tiSettings }: Entry): SymbolResult {
    const _candles = candlesData;

    const tdl = TDL({
        candles: _candles,
        topLineOpt: tiSettings.tdlTopLineOpt,
        bottomLineOpt: tiSettings.tdlbottomLineOpt
    });

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod });

    const lastCandle: Candle = _candles[_candles.length - 1];
    const lastPrice = lastCandle.close;

    const prevCandle: Candle = _candles[_candles.length - 2];
    const thirdCandle: Candle = _candles[_candles.length - 3];
    const fourthCandle: Candle = _candles[_candles.length - 4];
    const fifthCandle: Candle = _candles[_candles.length - 5];

    const candles = _candles.slice(tiSettings.smaPeriod * -1);

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
        percentAverageCandleMove,
        minCandleMove,
        avgCandleMove,
        lastCandleMove: lastCandle.open - lastCandle.close,
        prevCandleClose: prevCandle.close,
        atr,
        candleHasOpened: false
    };

    const symbolResult: SymbolResult = {
        symbol,
        position: null,
        entryPrice: lastPrice,
        percentLoss: null,
        signal: 'scalping',
        preferIndex: percentAverageCandleMove,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };

    if (
        tdl.signal == 'overBottom' &&
        lastCandle.close - lastCandle.open >= minCandleMove
    ) {

        let stopLoss = lastPrice - atr;

        if (stopLoss > tdl.bottomLinePrice) {
            stopLoss = tdl.bottomLinePrice - atr;
        }

        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;

    } else if (
        tdl.signal == 'underTop' &&
        lastCandle.open - lastCandle.close >= minCandleMove
    ) {

        let stopLoss = lastPrice + atr;

        if (stopLoss < tdl.topLinePrice) {
            stopLoss = tdl.topLinePrice + atr;
        }

        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
    }

    return symbolResult;
}