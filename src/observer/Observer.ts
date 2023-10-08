import { candlesTicksEvent } from '../binance_api/CandlesTicksStream';
import { Candle } from '../binance_api/types';
import { ATR, RSI, SMA, candlePatterns } from '../indicators';
import { openPosition, openedPositions } from '../positions';
import { Signal, StopSignal } from './types';

export default class Observer {
    symbol: string;

    constructor(symbol: string) {
        this.symbol = symbol;
    }

    start() {
        candlesTicksEvent.on(this.symbol, data => {
            const lastCandle: Candle = data.slice(-1)[0];

            if (!lastCandle.new || openedPositions.has(this.symbol)) return;

            const lastPrice = lastCandle.close;
            const signal = this.getSignals(data);
            const atr = ATR({ data, period: 14 });

            let stopLoss;

            if (signal == 'long') {
                stopLoss = lastPrice - atr.last * 2;
            } else if (signal == 'short') {
                stopLoss = lastPrice + atr.last * 2;
            }

            console.log(signal);

            if (signal) {
                openPosition({
                    symbol: this.symbol,
                    direction: signal,
                    entryPrice: lastPrice,
                    stopLoss,
                });
            }
        });
    }

    getSignals(data: Candle[]): Signal {
        const scores = {
            long: 0,
            short: 0,
        };

        const sma = this.smaSignal(data);
        const rsi = this.rsiSignal(data);
        const candle = this.candleSignal(data);

        // check signals
        if (sma === 'long') {
            scores.long++;
        } else if (sma === 'short') {
            scores.short++;
        }

        console.log('Bullish Candle Patterns');
        console.log('BullishEngulfing', candle.BullishEngulfing);
        console.log('Hammer', candle.Hammer);
        console.log('BullishSpinningTop', candle.BullishSpinningTop);
        console.log('ThreeWhiteSoldiers', candle.ThreeWhiteSoldiers);
        console.log('Bearish Candle Patterns');
        console.log('BearishEngulfing', candle.BearishEngulfing);
        console.log('HangingMan', candle.HangingMan);
        console.log('BearishSpinningTop', candle.BearishSpinningTop);
        console.log('ThreeBlackCrows', candle.ThreeBlackCrows);

        // candle bullish
        scores.long += (candle.BullishEngulfing + candle.Hammer + candle.BullishSpinningTop + candle.ThreeWhiteSoldiers);

        // candle bearish
        scores.short += (candle.BearishEngulfing + candle.HangingMan + candle.BearishSpinningTop + candle.ThreeBlackCrows);

        // stop signals
        if (rsi === 'stopLong') {
            scores.long--;
        } else if (rsi === 'stopShort') {
            scores.short--;
        }

        // result
        if (scores.long > scores.short) {
            return 'long';
        } else if (scores.long < scores.short) {
            return 'short';
        }

        return null;
    }

    smaSignal(data: Candle[]): Signal {
        const sma = SMA({ data, period: 9 });
        // const atr = ATR({ data, period: 14 });
        const prevCandle = data.slice(-2)[0];
        const lastCandle = data.slice(-1)[0];

        if (prevCandle.open < sma.last && prevCandle.close > sma.last) {
            return 'long';
        } else if (prevCandle.open > sma.last && prevCandle.close < sma.last) {
            return 'short';
        }

        return null;
    }

    rsiSignal(data: Candle[]): StopSignal {
        const rsi = RSI({ data, period: 14, symbol: this.symbol });

        if (rsi.last >= 70) {
            return 'stopLong';
        } else if (rsi.last <= 30) {
            return 'stopShort';
        }

        return null;
    }

    candleSignal(data: Candle[]) {
        return candlePatterns({ data });
    }
}
