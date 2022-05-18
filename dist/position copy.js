"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("./config");
const binanceApi_1 = require("./binance_api/binanceApi");
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const binanceAuth = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
class Position {
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
    // async setEntryOrder(): Promise<{
    //     entryOrder?: any;
    //     stopLossOrder?: any;
    //     error?: string;
    //     errorMsg?: string;
    //     positionKey?: string;
    // }> {
    //     // leverage
    //     const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
    //     // entry
    //     const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
    //     const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
    //     const entryParams = {
    //         type: 'LIMIT',
    //         timeInForce: 'GTC'
    //     };
    //     if (quantity == 0) {
    //         return { error: 'QUANTITY_IS_NULL', positionKey: this.positionKey };
    //     }
    //     const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);
    //     // stop loss
    //     const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
    //     const exitParams = {
    //         type: 'STOP_MARKET',
    //         closePosition: true,
    //         // stopPrice: +this.stopLoss.toFixed(this.symbolInfo.pricePrecision)
    //     };
    //     const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
    //     this.stopLossClientOrderId = stopOrd.clientOrderId;
    //     // watch
    //     this.watchPosition();
    //     return { entryOrder: entryOrd, stopLossOrder: stopOrd };
    // }
    // SCALPING Orders
    async setOrders() {
        this.entryClientOrderId = 'luf21_scalp_' + this.symbol;
        // watch
        this.watchOrder();
        this.watchPosition();
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        let usdtAmount = this.lossAmount * (100 / this.percentLoss - this.fee);
        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        console.log('Position -> setOrders -> ', { quantity, usdtAmount });
        const entryParams = {
            type: 'MARKET',
            newClientOrderId: this.entryClientOrderId
        };
        if (quantity < this.symbolInfo.minMarketLotSize) {
            console.log(`Position -> setOrders() -> Error: 'SMALL_LOT_SIZE', errorMsg: 'Min: ' + ${this.symbolInfo.minMarketLotSize} + '; Current: ' + ${quantity}, positionKey: ${this.positionKey}`);
            this.deletePositionInner({ excludeKey: this.positionKey });
            return;
        }
        if (usdtAmount < 5) {
            console.log(`Position -> setOrders() -> Error: 'SMALL_AMOUNT', errorMsg: 'Small Amount: ' + ${usdtAmount}, positionKey: ${this.positionKey}`);
            this.deletePositionInner({ excludeKey: this.positionKey });
            return;
        }
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);
        console.log('Position -> setOrders() -> entryOrd');
        console.log(entryOrd);
        this.quantity = +entryOrd.origQty;
        if (entryOrd.code == -4164 || entryOrd.code == -2019) {
            this.deletePositionInner({ excludeKey: this.positionKey });
        }
    }
    watchOrder() {
        (0, binanceApi_1.ordersUpdateStream)(this.symbol, order => {
            if (order.clientOrderId == this.entryClientOrderId && order.orderStatus == 'FILLED') {
                this.realEntryPrice = +order.averagePrice;
                this.quantity = +order.originalQuantity;
                // take profit
                if (this.setTakeProfit) {
                    const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                    const profitParams = {
                        type: 'LIMIT',
                        timeInForce: 'GTC',
                        reduceOnly: true
                    };
                    // const profitParams2 = {
                    //     type: 'LIMIT',
                    //     timeInForce: 'GTC',
                    //     reduceOnly: true
                    // };
                    let prevStopPrice;
                    let stopPrice;
                    const profitPercent = (this.takeProfitPerc || this.percentLoss) + this.fee;
                    const multiplier = this.realEntryPrice / 100;
                    if (this.position === 'long') {
                        // prevStopPrice = this.realEntryPrice + ((profitPercent / 2) * multiplier);
                        stopPrice = this.realEntryPrice + (profitPercent * multiplier);
                    }
                    else {
                        // prevStopPrice = this.realEntryPrice - ((profitPercent / 2) * multiplier);
                        stopPrice = this.realEntryPrice - (profitPercent * multiplier);
                    }
                    // prevStopPrice = +prevStopPrice.toFixed(this.symbolInfo.pricePrecision);
                    stopPrice = +stopPrice.toFixed(this.symbolInfo.pricePrecision);
                    // const prevQty = +(this.quantity / 2).toFixed(this.symbolInfo.quantityPrecision);
                    // const qty = this.quantity - prevQty;
                    console.log('Position -> watchOrder() -> take profit params');
                    console.log(profitSide, this.symbol, this.quantity, stopPrice);
                    console.log(profitParams);
                    binanceAuth.futuresOrder(profitSide, this.symbol, this.quantity, stopPrice, profitParams)
                        .then(arg => {
                        console.log('Position -> watchOrder() -> take profit order');
                        console.log(arg);
                    });
                    // console.log('Position -> watchOrder() -> take profit 2 params');
                    // console.log(profitSide, this.symbol, qty, stopPrice);
                    // console.log(profitParams2);
                    // binanceAuth.futuresOrder(profitSide, this.symbol, qty, stopPrice, profitParams2)
                    //     .then(arg => {
                    //         console.log('Position -> watchOrder() -> take profit order');
                    //         console.log(arg);
                    //     });
                }
                // stop loss
                const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const exitParams = {
                    type: 'STOP_MARKET',
                    closePosition: true,
                    stopPrice: null
                };
                if (this.position === 'long') {
                    exitParams.stopPrice = this.realEntryPrice - (this.percentLoss * (this.realEntryPrice / 100));
                }
                else {
                    exitParams.stopPrice = this.realEntryPrice + (this.percentLoss * (this.realEntryPrice / 100));
                }
                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    this.stopLossClientOrderId = ord.clientOrderId;
                    console.log('Position -> watchOrder() -> stop loss order');
                    console.log(ord);
                });
            }
        });
    }
    watchPosition() {
        (0, CandlesTicksStream_1.symbolCandlesTicksStream)(this.symbol, data => {
            const lastPrice = data[data.length - 1].close;
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
            // const rsi = RSI({ data, period: this.rsiPeriod, symbol: this.symbol });
            // if (this.position == 'long' && rsi.last >= rsi.avgRsiAbove) {
            //     this.closePositionMarket(lastPrice);
            // } else if (this.position == 'short' && rsi.last <= rsi.avgRsiBelow) {
            //     this.closePositionMarket(lastPrice);
            // }
        });
        (0, binanceApi_1.positionUpdateStream)(this.symbol, (pos) => {
            if (pos.positionAmount == '0') {
                this.deletePositionInner({ clearExcludedSymbols: true });
            }
        });
    }
    async moveStopLoss() {
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: null
        };
        let percentLoss;
        if (this.trailingSteps === 0) {
            percentLoss = this.trailingStopStartOrderPerc;
        }
        else {
            percentLoss = this.trailingStopStartTriggerPricePerc + this.trailingStopTriggerPriceStepPerc * this.trailingSteps - this.trailingStopOrderDistancePerc;
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
        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        console.log('Position -> moveStopLoss() -> trailing stop order');
        console.log(stopOrd);
        this.stopLossClientOrderId = stopOrd.clientOrderId;
        this.trailingSteps++;
        this.stopLossHasBeenMoved = false;
    }
    closePositionMarket(lastPrice) {
        if (this.marketCloseOrderHasBeenCalled) {
            return;
        }
        let profit = 0;
        if (this.position === 'long') {
            profit = (lastPrice - this.realEntryPrice) / (this.realEntryPrice / 100);
        }
        else {
            profit = (this.realEntryPrice - lastPrice) / (this.realEntryPrice / 100);
        }
        if (profit < this.fee) {
            return;
        }
        this.marketCloseOrderHasBeenCalled = true;
        const closeSide = this.position === 'long' ? 'SELL' : 'BUY';
        const ordParams = {
            type: 'MARKET',
            reduceOnly: 'true'
        };
        // console.log(closeSide, ordParams, this.quantity, this.symbol);
        binanceAuth.futuresOrder(closeSide, this.symbol, this.quantity, false, ordParams).then(arg => {
            // console.log('Market close position');
            // console.log(arg);
        });
    }
    deletePositionInner(opt) {
        (0, binanceApi_1.ordersUpdateStream)(this.symbol, null, true);
        (0, binanceApi_1.positionUpdateStream)(this.symbol, null, true);
        (0, CandlesTicksStream_1.symbolCandlesTicksStream)(this.symbol, null, true);
        binanceAuth.futuresCancelAll(this.symbol).then(() => {
            if (this.deletePosition !== undefined) {
                this.deletePosition(opt);
            }
        });
    }
}
exports.Position = Position;
//# sourceMappingURL=position%20copy.js.map