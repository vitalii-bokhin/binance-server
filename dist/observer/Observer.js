"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TradesList_1 = require("../binance_api/TradesList");
const indicators_1 = require("../indicators");
const positions_1 = require("../positions");
class Observer {
    symbol;
    tradeSignalAcc;
    constructor(symbol) {
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
        TradesList_1.tradeListEvent.on(this.symbol, (data) => {
            if (positions_1.openedPositions.has(this.symbol))
                return;
            const signal = this.getTradeListSignal(data);
            if (signal) {
                console.log(signal);
                const lastPrice = data.price;
                const lossStep = (lastPrice / 100) * 1;
                let stopLoss;
                if (signal == 'long') {
                    stopLoss = lastPrice - lossStep;
                }
                else if (signal == 'short') {
                    stopLoss = lastPrice + lossStep;
                }
                if (stopLoss) {
                    (0, positions_1.openPosition)({
                        symbol: this.symbol,
                        direction: signal,
                        entryPrice: lastPrice,
                        stopLoss,
                    });
                }
            }
        });
    }
    getSignals(data) {
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
        }
        else if (sma === 'short') {
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
        }
        else if (rsi === 'stopShort') {
            scores.short--;
        }
        // result
        if (scores.long > scores.short) {
            return 'long';
        }
        else if (scores.long < scores.short) {
            return 'short';
        }
        return null;
    }
    smaSignal(data) {
        const sma = (0, indicators_1.SMA)({ data, period: 9 });
        // const atr = ATR({ data, period: 14 });
        const prevCandle = data.slice(-2)[0];
        // const lastCandle = data.slice(-1)[0];
        if (prevCandle.open < sma.last && prevCandle.close > sma.last) {
            return 'long';
        }
        else if (prevCandle.open > sma.last && prevCandle.close < sma.last) {
            return 'short';
        }
        return null;
    }
    rsiSignal(data) {
        const rsi = (0, indicators_1.RSI)({ data, period: 14, symbol: this.symbol });
        if (rsi.last >= 70) {
            return 'stopLong';
        }
        else if (rsi.last <= 30) {
            return 'stopShort';
        }
        return null;
    }
    candleSignal(data) {
        return (0, indicators_1.candlePatterns)({ data });
    }
    /**
     * Signal by trade list data
     *
     * @param {object} data TradeListData
     * @return {string | null} Signal
     */
    getTradeListSignal(data) {
        if (!this.tradeSignalAcc.lastTime) {
            this.tradeSignalAcc.lastTime = data.time;
        }
        if (data.isBuyerMaker) {
            this.tradeSignalAcc.sellQty += data.qty;
        }
        else {
            this.tradeSignalAcc.buyQty += data.qty;
        }
        console.log(this.tradeSignalAcc);
        if (this.tradeSignalAcc.lastTime && data.time - this.tradeSignalAcc.lastTime >= 60 * 1000) {
            let signal = null;
            if (this.tradeSignalAcc.buyQty > this.tradeSignalAcc.sellQty) {
                signal = 'long';
            }
            else if (this.tradeSignalAcc.buyQty < this.tradeSignalAcc.sellQty) {
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
exports.default = Observer;
//# sourceMappingURL=Observer.js.map