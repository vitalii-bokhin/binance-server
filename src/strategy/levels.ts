import { getTickerStreamCache } from '../binance_api/binanceApi';
import { ATR, LVL, RSI, SMA, TDL } from '../indicators';
import { CheckCandle } from '../indicators/candle'; '../indicators/candle';
import { Candle, CdlDir, SymbolResult, Entry, Result } from './types';

export function Levels({ symbol, candlesData, tiSettings, levelsOpt }: Entry): SymbolResult {
    const _candles = candlesData;

    // const tdl = TDL({ candles: _candles, lineOpt: tdlOpt[0], symbol });

    const levels = levelsOpt.map(opt => LVL({ candles: _candles, levelOpt: opt, symbol }));

    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod }).last;

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
        strategy: 'levels',
        preferIndex: percentAverageCandleMove,
        rsiPeriod: tiSettings.rsiPeriod,
        signalDetails,
        resolvePosition: false
    };

    levels.forEach(lvl => {
        if (lvl.signal == 'bounceUp' || lvl.signal == 'crossAbove') {
            // let stopLoss = lastPrice - atr;
            let stopLoss = lvl.bottomLvlPrice;

            const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

            signalDetails.stopLoss = stopLoss;
            signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

            symbolResult.position = 'long';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;

        } else if (lvl.signal == 'bounceDown' || lvl.signal == 'crossBelow') {
            // let stopLoss = lastPrice + atr;
            let stopLoss = lvl.topLvlPrice;

            const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

            signalDetails.stopLoss = stopLoss;
            signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

            symbolResult.position = 'short';
            symbolResult.percentLoss = percentLoss;
            symbolResult.resolvePosition = true;
        }
    });

    return symbolResult;
}