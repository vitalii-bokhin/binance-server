import { getTickerStreamCache } from '../binance_api/binanceApi';
import { ATR, LVL, RSI, SMA, TDL } from '../indicators';
import { CheckCandle } from '../indicators/candle'; '../indicators/candle';
import { Candle, CdlDir, SymbolResult, Entry, Result } from './types';
let i = 0;
export function Levels({ symbol, candlesData, tiSettings, levelsOpt }: Entry): SymbolResult {
    const _candles = candlesData;

    // const tdl = TDL({ candles: _candles, lineOpt: tdlOpt[0], symbol });

    const lvl = LVL({ candles: _candles, levelsOpt });
    const atr = ATR({ data: _candles, period: tiSettings.atrPeriod }).last;

    const lstCdls = _candles.slice(-2);
    const prevCandle: Candle = lstCdls[0];
    const lastCandle: Candle = lstCdls[1];

    const lastPrice = lastCandle.close;

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

    const long = function (stopLoss) {
        const percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.close - lastCandle.open;

        symbolResult.position = 'long';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
    }

    const short = function (stopLoss){
        const percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);

        signalDetails.stopLoss = stopLoss;
        signalDetails.lastCandleMove = lastCandle.open - lastCandle.close;

        symbolResult.position = 'short';
        symbolResult.percentLoss = percentLoss;
        symbolResult.resolvePosition = true;
    }

    if (lvl.signal) {
        console.log(lvl);
        console.log(i++);
        if (lvl.signal == 'nextToTop') {
            if (
                lastPrice > lvl.topPrice
                && lastCandle.close > lastCandle.open
            ) {
                long(lvl.bottomPrice);
            }

        } else if (lvl.signal == 'nextToBottom') {
            if (
                lastPrice < lvl.bottomPrice
                && lastCandle.close < lastCandle.open
            ) {
                short(lvl.topPrice);

            } else if (
                lastPrice > lvl.topPrice
                && lastCandle.close > lastCandle.open
            ) {
                long(lvl.bottomPrice);
            }

        } else if (lvl.signal == 'cuddleBottom') {
            if (
                lastPrice > lvl.topPrice
                && lastCandle.close > lastCandle.open
            ) {
                long(lvl.bottomPrice);
            }

        } else if (lvl.signal == 'retestBottom') {
            if (
                lastPrice < lvl.bottomPrice
                && lastCandle.close < lastCandle.open
            ) {
                short(lvl.topPrice);
            }

        } else if (lvl.signal == 'retestTop') {
            if (
                lastPrice > lvl.topPrice
                && lastCandle.close > lastCandle.open
            ) {
                long(lvl.bottomPrice);
            }

        } else if (lvl.signal == 'cuddleTop') {
            if (
                lastPrice < lvl.bottomPrice
                && lastCandle.close < lastCandle.open
            ) {
                short(lvl.topPrice);
            }
        }
    }

    console.log(symbolResult.position);

    return symbolResult;
}