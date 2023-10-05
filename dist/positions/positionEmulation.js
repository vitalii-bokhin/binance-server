"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionEmulation = void 0;
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const db_1 = require("./db/db");
class PositionEmulation {
    constructor(opt) {
        this.stopLossHasBeenMoved = false;
        this.marketCloseOrderHasBeenCalled = false;
        this.trailingSteps = 0;
        this.positionKey = opt.positionKey;
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.entryPrice = opt.entryPrice;
        this.takeProfit = opt.takeProfit;
        this.fee = opt.fee;
        this.leverage = opt.leverage;
        this.symbols = opt.symbols;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopStartTriggerPricePerc = opt.trailingStopStartTriggerPricePerc;
        this.trailingStopStartOrderPerc = opt.trailingStopStartOrderPerc;
        this.trailingStopTriggerPriceStepPerc = opt.trailingStopTriggerPriceStepPerc;
        this.trailingStopOrderDistancePerc = opt.trailingStopOrderDistancePerc;
        this.signal = opt.signal;
        this.interval = opt.interval;
        this.limit = opt.limit;
        this.rsiPeriod = opt.rsiPeriod;
        this.percentLoss = opt.percentLoss;
        this.signalDetails = opt.signalDetails;
        this.setTakeProfit = opt.setTakeProfit !== undefined ? opt.setTakeProfit : false;
        this.takeProfitPerc = opt.takeProfitPerc !== undefined ? opt.takeProfitPerc : null;
        this.useTrailingStop = opt.useTrailingStop !== undefined ? opt.useTrailingStop : false;
        this.initiator = opt.initiator;
        this.lossAmount = opt.lossAmount;
    }
    async setOrders() {
        // watch
        this.watchPosition();
        // entry
        let usdtAmount = this.lossAmount * (100 / this.percentLoss - this.fee);
        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        console.log('Position -> setOrders -> ', { quantity, usdtAmount });
        this.quantity = quantity;
        this.entryOrderOpened();
    }
    entryOrderOpened() {
        this.realEntryPrice = this.entryPrice;
        // take profit
        if (this.setTakeProfit) {
            let profitPrice;
            const profitPercent = (this.takeProfitPerc || this.percentLoss) + this.fee;
            const multiplier = this.realEntryPrice / 100;
            if (this.position === 'long') {
                profitPrice = this.realEntryPrice + (profitPercent * multiplier);
            }
            else {
                profitPrice = this.realEntryPrice - (profitPercent * multiplier);
            }
            profitPrice = +profitPrice.toFixed(this.symbolInfo.pricePrecision);
            this.takeProfitPrice = profitPrice;
        }
        // stop loss
        let stopPrice;
        if (this.position === 'long') {
            stopPrice = this.realEntryPrice - (this.percentLoss * (this.realEntryPrice / 100));
        }
        else {
            stopPrice = this.realEntryPrice + (this.percentLoss * (this.realEntryPrice / 100));
        }
        stopPrice = +stopPrice.toFixed(this.symbolInfo.pricePrecision);
        this.stopLossPrice = stopPrice;
    }
    watchPosition() {
        (0, CandlesTicksStream_1.symbolCandlesTicksStream)(this.symbol, data => {
            const lastPrice = data[data.length - 1].close;
            if (this.position === 'long') {
                if (lastPrice >= this.takeProfitPrice) {
                    this.logPosition('profit', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
                else if (lastPrice <= this.stopLossPrice) {
                    if (this.trailingSteps > 0) {
                        this.logPosition('breakEven');
                    }
                    else {
                        this.logPosition('loss', this.lossAmount);
                    }
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
            }
            else {
                if (lastPrice <= this.takeProfitPrice) {
                    this.logPosition('profit', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
                else if (lastPrice >= this.stopLossPrice) {
                    if (this.trailingSteps > 0) {
                        this.logPosition('breakEven');
                    }
                    else {
                        this.logPosition('loss', this.lossAmount);
                    }
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
            }
            if (!this.stopLossHasBeenMoved && this.useTrailingStop) {
                if (this.trailingSteps > 0 && !this.trailingStopTriggerPriceStepPerc) {
                    return;
                }
                let changePerc;
                const triggerPerc = this.trailingSteps === 0 ? this.trailingStopStartTriggerPricePerc : this.trailingStopStartTriggerPricePerc + this.trailingStopTriggerPriceStepPerc * this.trailingSteps;
                if (this.position === 'long') {
                    changePerc = (lastPrice - this.realEntryPrice) / (this.realEntryPrice / 100);
                }
                else {
                    changePerc = (this.realEntryPrice - lastPrice) / (this.realEntryPrice / 100);
                }
                if (changePerc >= triggerPerc) {
                    this.stopLossHasBeenMoved = true;
                    this.moveStopLoss();
                }
            }
        });
    }
    moveStopLoss() {
        const exitParams = {
            stopPrice: null
        };
        let percentLoss;
        if (this.trailingSteps === 0) {
            percentLoss = this.trailingStopStartOrderPerc;
        }
        else {
            percentLoss = this.trailingStopStartTriggerPricePerc + (this.trailingStopTriggerPriceStepPerc * this.trailingSteps) - this.trailingStopOrderDistancePerc;
            if (percentLoss <= this.trailingStopStartOrderPerc) {
                percentLoss = this.trailingStopStartOrderPerc;
            }
        }
        if (this.position === 'long') {
            exitParams.stopPrice = this.realEntryPrice + ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        }
        else {
            exitParams.stopPrice = this.realEntryPrice - ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        }
        this.stopLossPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
        this.trailingSteps++;
        this.stopLossHasBeenMoved = false;
    }
    async logPosition(type, amount) {
        let wallet = await (0, db_1.GetData)('wallet');
        if (!wallet) {
            wallet = {};
        }
        if (!wallet[this.signal]) {
            wallet[this.signal] = 100;
        }
        if (type === 'profit') {
            wallet[this.signal] += amount;
        }
        else if (type === 'loss') {
            wallet[this.signal] -= amount;
        }
        await (0, db_1.SaveData)('wallet', wallet);
    }
    deletePositionInner(opt) {
        (0, CandlesTicksStream_1.symbolCandlesTicksStream)(this.symbol, null, true);
        if (this.deletePosition !== undefined) {
            this.deletePosition(opt);
        }
    }
}
exports.PositionEmulation = PositionEmulation;
//# sourceMappingURL=positionEmulation.js.map