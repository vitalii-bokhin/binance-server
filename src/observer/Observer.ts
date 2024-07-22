import { tradeListEvent } from '../binance_api/TradesList';
import { Candle, TradeListData } from '../binance_api/types';
import { RSI, SMA, candlePatterns } from '../indicators';
import { openPosition, openedPositions } from '../positions';
import { Signal, StopSignal } from './types';

export default class Observer {
    symbol: string;
    tradeSignalAcc: { buyQty: number; sellQty: number; lastTime?: number };

    constructor(symbol: string) {
        this.symbol = symbol;
        this.tradeSignalAcc = {
            buyQty: 0,
            sellQty: 0,
        };
    }

    start() {
        // candlesTicksEvent.on(this.symbol, data => {
        //     const lastCandle: Candle = data.slice(-1)[0];

        //     if (!lastCandle.new || openedPositions.has(this.symbol)) return;

        //     const lastPrice = lastCandle.close;
        //     const signal = this.getSignals(data);
        //     const atr = ATR({ data, period: 14 });

        //     let stopLoss;

        //     if (signal == 'long') {
        //         stopLoss = lastPrice - atr.last * 2;
        //     } else if (signal == 'short') {
        //         stopLoss = lastPrice + atr.last * 2;
        //     }

        //     console.log(signal);

        //     if (signal) {
        //         openPosition({
        //             symbol: this.symbol,
        //             direction: signal,
        //             entryPrice: lastPrice,
        //             stopLoss,
        //         });
        //     }
        // });

        tradeListEvent.on(this.symbol, (data: TradeListData) => {
            if (openedPositions.has(this.symbol)) return;

            const signal = this.getTradeListSignal(data);

            if (signal) {
                console.log(signal);

                const lastPrice = data.price;
                const lossStep = (lastPrice / 100) * 1;
                let stopLoss: number | undefined;

                if (signal == 'long') {
                    stopLoss = lastPrice - lossStep;
                } else if (signal == 'short') {
                    stopLoss = lastPrice + lossStep;
                }

                if (stopLoss) {
                    openPosition({
                        symbol: this.symbol,
                        direction: signal,
                        entryPrice: lastPrice,
                        stopLoss,
                    });
                }
            }
        });
    }

    getSignals(data: Candle[]): Signal | null {
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
        scores.long += candle.BullishEngulfing + candle.Hammer + candle.BullishSpinningTop + candle.ThreeWhiteSoldiers;

        // candle bearish
        scores.short +=
            candle.BearishEngulfing + candle.HangingMan + candle.BearishSpinningTop + candle.ThreeBlackCrows;

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

    smaSignal(data: Candle[]): Signal | null {
        const sma = SMA({ data, period: 9 });
        // const atr = ATR({ data, period: 14 });
        const prevCandle = data.slice(-2)[0];
        // const lastCandle = data.slice(-1)[0];

        if (prevCandle.open < sma.last && prevCandle.close > sma.last) {
            return 'long';
        } else if (prevCandle.open > sma.last && prevCandle.close < sma.last) {
            return 'short';
        }

        return null;
    }

    rsiSignal(data: Candle[]): StopSignal | null {
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

    /**
     * Signal by trade list data
     *
     * @param {object} data TradeListData
     * @return {string | null} Signal
     */
    private getTradeListSignal(data: TradeListData): Signal | null {
        if (!this.tradeSignalAcc.lastTime) {
            this.tradeSignalAcc.lastTime = data.time;
        }

        if (data.isBuyerMaker) {
            this.tradeSignalAcc.sellQty += data.qty;
        } else {
            this.tradeSignalAcc.buyQty += data.qty;
        }

        console.log(this.tradeSignalAcc);

        if (this.tradeSignalAcc.lastTime && data.time - this.tradeSignalAcc.lastTime >= 60 * 1000) {
            let signal: Signal | null = null;

            if (this.tradeSignalAcc.buyQty > this.tradeSignalAcc.sellQty) {
                signal = 'long';
            } else if (this.tradeSignalAcc.buyQty < this.tradeSignalAcc.sellQty) {
                signal = 'short';
            }

            this.tradeSignalAcc.buyQty = 0;
            this.tradeSignalAcc.sellQty = 0;
            this.tradeSignalAcc.lastTime = data.time;

            return signal;
        }

        return null;
    }
}
