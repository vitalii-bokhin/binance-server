"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CandlesTicksStream_1 = require("../binance_api/CandlesTicksStream");
const db_1 = require("../db");
const wss_1 = require("../server/wss");
class PositionEmulation {
    constructor(opt) {
        this.symbol = opt.symbol;
        this.direction = opt.direction;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.fee = .08;
        this.lossUSDT = 1;
        this.averaged = false;
    }
    open() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.setEntryOrders();
            this.setOutgoingOrders();
            yield this.watch();
            return this.symbol;
        });
    }
    setEntryOrders() {
        return __awaiter(this, void 0, void 0, function* () {
            let percentLoss;
            if (this.direction == 'long') {
                percentLoss = (this.entryPrice - this.stopLoss) / (this.entryPrice / 100);
            }
            else if (this.direction == 'short') {
                percentLoss = (this.stopLoss - this.entryPrice) / (this.entryPrice / 100);
            }
            // entry
            const usdtAmount = this.lossUSDT * (100 / (percentLoss + this.fee));
            const quantity = usdtAmount / this.entryPrice;
            this.percentLoss = percentLoss;
            this.usdtAmount = usdtAmount;
            this.quantity = quantity;
            yield this.logPosition('open', usdtAmount);
            console.log('PositionEmulation -> setEntryOrders -> ', { entryPrice: this.entryPrice, percentLoss: percentLoss + this.fee, quantity, usdtAmount });
        });
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
        return new Promise((resolve) => {
            this.candleTick = (data) => __awaiter(this, void 0, void 0, function* () {
                const lastPrice = data.slice(-1)[0].close;
                if (this.direction === 'long') {
                    if (lastPrice >= this.takeProfit) {
                        yield this.close('profit');
                        resolve();
                    }
                    else if (lastPrice <= this.stopLoss) {
                        if (this.averaged) {
                            yield this.close('loss');
                            resolve();
                        }
                        else {
                            yield this.average();
                        }
                    }
                }
                else {
                    if (lastPrice <= this.takeProfit) {
                        yield this.close('profit');
                        resolve();
                    }
                    else if (lastPrice >= this.stopLoss) {
                        if (this.averaged) {
                            yield this.close('loss');
                            resolve();
                        }
                        else {
                            yield this.average();
                        }
                    }
                }
            });
            CandlesTicksStream_1.candlesTicksEvent.on(this.symbol, this.candleTick);
        });
    }
    average() {
        return __awaiter(this, void 0, void 0, function* () {
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
            const usdtAmount = this.lossUSDT * (100 / (percentLoss + this.fee));
            const quantity = usdtAmount / newEntryPrice;
            const avgEntryPrice = (newEntryPrice + this.entryPrice) / 2;
            this.percentLoss = percentLoss;
            this.usdtAmount += usdtAmount;
            this.quantity += quantity;
            this.entryPrice = avgEntryPrice;
            this.stopLoss = newStopLoss;
            yield this.logPosition('open', usdtAmount);
            console.log('PositionEmulation -> average -> ', { entryPrice: this.entryPrice, percentLoss: percentLoss + this.fee, quantity, usdtAmount });
            this.averaged = true;
            this.setOutgoingOrders();
        });
    }
    close(result) {
        return __awaiter(this, void 0, void 0, function* () {
            CandlesTicksStream_1.candlesTicksEvent.off(this.symbol, this.candleTick);
            if (this.direction === 'long') {
                if (result == 'profit') {
                    const profitPercent = (this.takeProfit - this.entryPrice) / (this.entryPrice / 100) - this.fee;
                    const profitUsdt = profitPercent * (this.usdtAmount / 100);
                    yield this.logPosition('profit', profitUsdt);
                }
                else {
                    const lossPercent = (this.entryPrice - this.stopLoss) / (this.entryPrice / 100) + this.fee;
                    const lostUsdt = lossPercent * (this.usdtAmount / 100);
                    yield this.logPosition('loss', lostUsdt);
                }
            }
            else {
                if (result == 'profit') {
                    const profitPercent = (this.entryPrice - this.takeProfit) / (this.entryPrice / 100) - this.fee;
                    const profitUsdt = profitPercent * (this.usdtAmount / 100);
                    yield this.logPosition('profit', profitUsdt);
                }
                else {
                    const lossPercent = (this.stopLoss - this.entryPrice) / (this.entryPrice / 100) + this.fee;
                    const lostUsdt = lossPercent * (this.usdtAmount / 100);
                    yield this.logPosition('loss', lostUsdt);
                }
            }
        });
    }
    logPosition(type, amount) {
        return __awaiter(this, void 0, void 0, function* () {
            let wallet = yield (0, db_1.GetData)('wallet');
            if (!wallet) {
                wallet = {};
            }
            if (wallet[this.symbol] === undefined) {
                wallet[this.symbol] = 0;
            }
            if (type === 'open') {
                wallet[this.symbol] -= amount;
            }
            else if (type === 'profit') {
                wallet[this.symbol] += (this.usdtAmount + amount);
            }
            else if (type === 'loss') {
                wallet[this.symbol] += (this.usdtAmount - amount);
            }
            yield (0, db_1.SaveData)('wallet', wallet);
        });
    }
}
exports.default = PositionEmulation;
//# sourceMappingURL=PositionEmulation.js.map