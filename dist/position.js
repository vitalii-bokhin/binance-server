"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("./config");
const binanceApi_1 = require("./binanceApi");
const indicators_1 = require("./indicators");
const binanceAuth = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
class Position {
    constructor(opt) {
        this.stopLossHasBeenMoved = false;
        this.marketCloseOrderHasBeenCalled = false;
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
        this.trailingStopTriggerPerc = opt.trailingStopTriggerPerc; // first trailing move
        this.trailingStopPricePerc = opt.trailingStopPricePerc; // first trailing move
        this.trailingStepPerc = opt.trailingStepPerc;
        this.signal = opt.signal;
        this.interval = opt.interval;
        this.limit = opt.limit;
        this.rsiPeriod = opt.rsiPeriod;
        this.percentLoss = opt.percentLoss;
    }
    async setEntryOrder() {
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            type: 'LIMIT',
            timeInForce: 'GTC'
        };
        if (quantity == 0) {
            return { error: 'QUANTITY_IS_NULL', positionKey: this.positionKey };
        }
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);
        // stop loss
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            // stopPrice: +this.stopLoss.toFixed(this.symbolInfo.pricePrecision)
        };
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        this.stopLossClientOrderId = stopOrd.clientOrderId;
        // watch
        this.watchPosition();
        return { entryOrder: entryOrd, stopLossOrder: stopOrd };
    }
    // SCALPING Orders
    async setScalpingOrders() {
        this.entryClientOrderId = 'luf21_scalp_' + this.symbol;
        (0, binanceApi_1.ordersUpdateStream)(this.symbol, order => {
            if (order.clientOrderId == this.entryClientOrderId && order.orderStatus == 'FILLED') {
                const entryPrice = +order.averagePrice;
                this.realEntryPrice = entryPrice;
                // take profit
                const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const profitParams = {
                    type: 'TAKE_PROFIT_MARKET',
                    closePosition: true,
                    stopPrice: null
                };
                if (this.position === 'long') {
                    profitParams.stopPrice = entryPrice + ((this.percentLoss + this.fee) * (entryPrice / 100));
                }
                else {
                    profitParams.stopPrice = entryPrice - ((this.percentLoss + this.fee) * (entryPrice / 100));
                }
                profitParams.stopPrice = +profitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
                binanceAuth.futuresOrder(profitSide, this.symbol, false, false, profitParams).then(ord => {
                    console.log(ord);
                });
                // stop loss
                const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const exitParams = {
                    type: 'STOP_MARKET',
                    closePosition: true,
                    stopPrice: null
                };
                if (this.position === 'long') {
                    exitParams.stopPrice = entryPrice - ((this.percentLoss - this.fee) * (entryPrice / 100));
                }
                else {
                    exitParams.stopPrice = entryPrice + ((this.percentLoss - this.fee) * (entryPrice / 100));
                }
                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    console.log(ord);
                });
            }
        });
        // watch
        this.watchPosition();
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        // if (this.position === 'long') {
        //     this.possibleLoss = (this.entryPrice - ) / (this.entryPrice / 100);
        // } else {
        //     this.possibleLoss = ( - this.entryPrice) / (this.entryPrice / 100);
        // }
        let usdtAmount = .1 * ((100 / this.percentLoss) - this.fee);
        console.log('Amount');
        console.log(usdtAmount);
        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        console.log('Quantity');
        console.log(quantity);
        const entryParams = {
            type: 'MARKET',
            newClientOrderId: this.entryClientOrderId
        };
        if (quantity < this.symbolInfo.minMarketLotSize) {
            return {
                error: 'SMALL_LOT_SIZE',
                errorMsg: 'Min: ' + this.symbolInfo.minMarketLotSize + '; Current: ' + quantity,
                positionKey: this.positionKey
            };
        }
        // if (usdtAmount < 5) {
        //     return { error: 'SMALL_AMOUNT', errorMsg: 'Amount: ' + usdtAmount, positionKey: this.positionKey };
        // }
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);
        this.quantity = +entryOrd.origQty;
        return { entryOrder: entryOrd };
        // return {};
    }
    // WATCH POSITION
    watchPosition() {
        (0, binanceApi_1.candlesTicksStream)({ symbols: this.symbols, interval: this.interval, limit: this.limit }, data => {
            const candlesData = data[this.symbol], rsi = (0, indicators_1.RSI)({ data: candlesData, lng: this.rsiPeriod }), lastPrice = candlesData[candlesData.length - 1].close;
            if (this.position == 'long' && rsi.last >= 70) {
                this.closePositionMarket(lastPrice);
            }
            else if (this.position == 'short' && rsi.last <= 30) {
                this.closePositionMarket(lastPrice);
            }
        });
        // priceStream(this.symbol, price => {
        //     if (!HasBeenMoved) {
        //         let changePerc: number;
        //         if (this.position === 'long') {
        //             changePerc = (+price.markPrice - this.entryPrice) / (this.entryPrice / 100);
        //         } else {
        //             changePerc = (this.entryPrice - (+price.markPrice)) / (this.entryPrice / 100);
        //         }
        //         if (changePerc >= this.trailingStopTriggerPerc) {
        //             HasBeenMoved = true;
        //             this.moveStopLoss();
        //         }
        //     }
        // });
        (0, binanceApi_1.positionUpdateStream)(this.symbol, (pos) => {
            console.log('--position--');
            console.log(pos);
            if (pos.positionAmount == '0') {
                if (this.deletePositionCallback !== undefined) {
                    this.deletePositionCallback(this.positionKey);
                }
            }
        });
    }
    async moveStopLoss() {
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: 0
        };
        if (this.position === 'long') {
            exitParams.stopPrice = this.entryPrice + (this.trailingStopPricePerc * (this.entryPrice / 100));
        }
        else {
            exitParams.stopPrice = this.entryPrice - (this.trailingStopPricePerc * (this.entryPrice / 100));
        }
        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        this.stopLossClientOrderId = stopOrd.clientOrderId;
        this.trailingStopTriggerPerc = this.trailingStopTriggerPerc + this.trailingStepPerc;
        this.trailingStopPricePerc = this.trailingStopPricePerc + this.trailingStepPerc;
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
        console.log(closeSide, ordParams, this.quantity, this.symbol);
        binanceAuth.futuresOrder(closeSide, this.symbol, this.quantity, false, ordParams).then(arg => {
            console.log('Market close position');
            console.log(arg);
        });
    }
    deletePosition(callback) {
        this.deletePositionCallback = callback;
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map