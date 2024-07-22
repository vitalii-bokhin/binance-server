"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const CandlesTicksStream_1 = require("../binance_api/CandlesTicksStream");
const db_1 = require("../db");
const wss_1 = require("../server/wss");
class PositionEmulation {
    symbol;
    direction;
    fee;
    entryPrice;
    quantity;
    usdtAmount;
    takeProfit;
    stopLoss;
    lossUSDT;
    percentLoss;
    averaged;
    lostUsdtAmount;
    profitUsdtAmount;
    candleTick;
    constructor(opt) {
        this.symbol = opt.symbol;
        this.direction = opt.direction;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.fee = 0.08;
        this.lossUSDT = 1;
        this.averaged = false;
    }
    async open() {
        await this.setEntryOrders();
        this.setOutgoingOrders();
        await this.watch();
        return this.symbol;
    }
    async setEntryOrders() {
        let percentLoss;
        if (this.direction == 'long') {
            percentLoss = (this.entryPrice - this.stopLoss) / (this.entryPrice / 100);
        }
        else if (this.direction == 'short') {
            percentLoss = (this.stopLoss - this.entryPrice) / (this.entryPrice / 100);
        }
        // entry
        if (percentLoss) {
            const usdtAmount = this.lossUSDT * (100 / (percentLoss + this.fee));
            const quantity = usdtAmount / this.entryPrice;
            this.percentLoss = percentLoss;
            this.usdtAmount = usdtAmount;
            this.quantity = quantity;
            await this.logPosition('open', usdtAmount);
            console.log('PositionEmulation -> setEntryOrders -> ', {
                entryPrice: this.entryPrice,
                percentLoss: percentLoss + this.fee,
                quantity,
                usdtAmount,
            });
        }
    }
    setOutgoingOrders() {
        // take profit
        let profitPrice;
        let profitDistance;
        if (this.averaged) {
            profitDistance = this.fee * (this.entryPrice / 100);
        }
        else {
            profitDistance = (this.fee + this.percentLoss / 10) * (this.entryPrice / 100);
        }
        if (this.direction === 'long') {
            profitPrice = this.entryPrice + profitDistance;
        }
        else {
            profitPrice = this.entryPrice - profitDistance;
        }
        this.takeProfit = profitPrice;
        console.log('take profit', this.takeProfit);
        console.log('stop loss', this.stopLoss);
        wss_1.wsEvent.emit('send');
    }
    watch() {
        return new Promise(resolve => {
            this.candleTick = async (data) => {
                const lastPrice = data.slice(-1)[0].close;
                if (this.direction === 'long') {
                    if (lastPrice >= this.takeProfit) {
                        await this.close('profit');
                        resolve();
                    }
                    else if (lastPrice <= this.stopLoss) {
                        if (this.averaged) {
                            await this.close('loss');
                            resolve();
                        }
                        else {
                            await this.average();
                        }
                    }
                }
                else {
                    if (lastPrice <= this.takeProfit) {
                        await this.close('profit');
                        resolve();
                    }
                    else if (lastPrice >= this.stopLoss) {
                        if (this.averaged) {
                            await this.close('loss');
                            resolve();
                        }
                        else {
                            await this.average();
                        }
                    }
                }
            };
            CandlesTicksStream_1.candlesTicksEvent.on(this.symbol, this.candleTick);
        });
    }
    async average() {
        const prevStopLoss = this.stopLoss;
        const newEntryPrice = this.stopLoss;
        let newStopLoss;
        let percentLoss;
        if (this.direction == 'long') {
            newStopLoss = prevStopLoss - (this.entryPrice - this.stopLoss);
            percentLoss = (newEntryPrice - newStopLoss) / (newEntryPrice / 100);
        }
        else if (this.direction == 'short') {
            newStopLoss = prevStopLoss + (this.stopLoss - this.entryPrice);
            percentLoss = (newStopLoss - newEntryPrice) / (newEntryPrice / 100);
        }
        // avg entry
        if (percentLoss && newStopLoss) {
            const usdtAmount = this.lossUSDT * (100 / (percentLoss + this.fee));
            const quantity = usdtAmount / newEntryPrice;
            const avgEntryPrice = (newEntryPrice + this.entryPrice) / 2;
            this.percentLoss = percentLoss;
            this.usdtAmount += usdtAmount;
            this.quantity += quantity;
            this.entryPrice = avgEntryPrice;
            this.stopLoss = newStopLoss;
            await this.logPosition('open', usdtAmount);
            console.log('PositionEmulation -> average -> ', {
                entryPrice: this.entryPrice,
                percentLoss: percentLoss + this.fee,
                quantity,
                usdtAmount,
            });
            this.averaged = true;
            this.setOutgoingOrders();
        }
    }
    async close(result) {
        CandlesTicksStream_1.candlesTicksEvent.off(this.symbol, this.candleTick);
        if (this.direction === 'long') {
            if (result == 'profit') {
                const profitPercent = (this.takeProfit - this.entryPrice) / (this.entryPrice / 100) - this.fee;
                const profitUsdt = profitPercent * (this.usdtAmount / 100);
                await this.logPosition('profit', profitUsdt);
            }
            else {
                const lossPercent = (this.entryPrice - this.stopLoss) / (this.entryPrice / 100) + this.fee;
                const lostUsdt = lossPercent * (this.usdtAmount / 100);
                await this.logPosition('loss', lostUsdt);
            }
        }
        else {
            if (result == 'profit') {
                const profitPercent = (this.entryPrice - this.takeProfit) / (this.entryPrice / 100) - this.fee;
                const profitUsdt = profitPercent * (this.usdtAmount / 100);
                await this.logPosition('profit', profitUsdt);
            }
            else {
                const lossPercent = (this.stopLoss - this.entryPrice) / (this.entryPrice / 100) + this.fee;
                const lostUsdt = lossPercent * (this.usdtAmount / 100);
                await this.logPosition('loss', lostUsdt);
            }
        }
    }
    async logPosition(type, amount) {
        let wallet = await (0, db_1.GetData)('wallet');
        if (!wallet) {
            wallet = {};
        }
        if (wallet[this.symbol] === undefined) {
            wallet[this.symbol] = 0;
        }
        if (amount !== undefined) {
            if (type === 'open') {
                wallet[this.symbol] -= amount;
            }
            else if (type === 'profit') {
                wallet[this.symbol] += this.usdtAmount + amount;
            }
            else if (type === 'loss') {
                wallet[this.symbol] += this.usdtAmount - amount;
            }
        }
        await (0, db_1.SaveData)('wallet', wallet);
    }
}
exports.default = PositionEmulation;
//# sourceMappingURL=PositionEmulation.js.map