import { symbolCandlesTicksStream } from '../binance_api/CandlesTicksStream';
import { RSI, SMA, candlePatterns } from '../indicators';
import { Candle } from '../indicators/types';
import { Signal, StopSignal } from './types';

export default class Observer {
    symbol: string;

    constructor(symbol: string) {
        this.symbol = symbol;
    }

    start() {
        symbolCandlesTicksStream(this.symbol, data => {
            const signal = this.getSignals(data);

            console.log(signal);
        });
    }

    getSignals(data): Signal {
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

        // candle bullish
        console.log('BullishEngulfing', candle.BullishEngulfing);
        if (candle.BullishEngulfing) {
            scores.long++;
        }

        console.log('Hammer', candle.Hammer);
        if (candle.Hammer) {
            scores.long++;
        }

        // candle bearish
        console.log('BearishEngulfing', candle.BearishEngulfing);
        if (candle.BearishEngulfing) {
            scores.short++;
        }

        console.log('HangingMan', candle.HangingMan);
        if (candle.HangingMan) {
            scores.short++;
        }

        // stop signals
        if (rsi === 'StopLong') {
            scores.long--;
        } else if (rsi === 'StopShort') {
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
        const lastCandle = data.slice(-1)[0];

        if (lastCandle.close > sma.last) {
            return 'long';
        } else if (lastCandle.close < sma.last) {
            return 'short';
        }

        return null;
    }

    rsiSignal(data): StopSignal {
        const rsi = RSI({ data, period: 14, symbol: this.symbol });

        if (rsi.last >= 70) {
            return 'StopLong';
        } else if (rsi.last <= 30) {
            return 'StopShort';
        }

        return null;
    }

    candleSignal(data) {
        return candlePatterns({ data });
    }
}
