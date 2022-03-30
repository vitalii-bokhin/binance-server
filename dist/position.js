"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("./config");
const binanceApi_1 = require("./binanceApi");
const binanceAuth = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
class Position {
    constructor(opt) {
        this.stopLossHasBeenMoved = false;
        this.positionKey = opt.positionKey;
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.takeProfit = opt.takeProfit;
        this.fee = opt.fee;
        this.usdtAmount = opt.usdtAmount;
        this.leverage = opt.leverage;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopTriggerPerc = opt.trailingStopTriggerPerc; // first trailing move
        this.trailingStopPricePerc = opt.trailingStopPricePerc; // first trailing move
        this.trailingStepPerc = opt.trailingStepPerc;
        this.signal = opt.signal;
    }
    async setEntryOrder() {
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            type: 'LIMIT',
            timeInForce: 'GTC',
            workingType: 'MARK_PRICE'
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
            workingType: 'MARK_PRICE',
            stopPrice: +this.stopLoss.toFixed(this.symbolInfo.pricePrecision)
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
                // take profit
                const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const profitParams = {
                    type: 'TAKE_PROFIT_MARKET',
                    closePosition: true,
                    workingType: 'MARK_PRICE',
                    stopPrice: null
                };
                if (this.position === 'long') {
                    profitParams.stopPrice = entryPrice + ((this.possibleLoss + this.fee) * (entryPrice / 100));
                }
                else {
                    profitParams.stopPrice = entryPrice - ((this.possibleLoss + this.fee) * (entryPrice / 100));
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
                    workingType: 'MARK_PRICE',
                    stopPrice: null
                };
                // if (this.position === 'long') {
                //     exitParams.stopPrice = entryPrice - ((this.possibleLoss - this.fee) * (entryPrice / 100));
                // } else {
                //     exitParams.stopPrice = entryPrice + ((this.possibleLoss - this.fee) * (entryPrice / 100));
                // }
                exitParams.stopPrice = this.stopLoss;
                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    console.log(ord);
                });
            }
        });
        (0, binanceApi_1.positionUpdateStream)(this.symbol, (pos) => {
            console.log('--position--');
            console.log(pos);
            if (pos.positionAmount == '0') {
                if (this.deletePositionCallback !== undefined) {
                    this.deletePositionCallback(this.positionKey);
                }
            }
        });
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        // let usdtAmount = 0;
        if (this.position === 'long') {
            this.usdtAmount = .05 * (this.entryPrice / (this.entryPrice - this.stopLoss));
            // this.usdtAmount = .05 * ((100 / this.possibleLoss) - this.fee);
        }
        else {
            this.usdtAmount = .05 * (this.entryPrice / (this.stopLoss - this.entryPrice));
            // this.usdtAmount = .05 * ((100 / this.possibleLoss) - this.fee);
        }
        this.usdtAmount -= this.fee * (this.usdtAmount / 100);
        console.log('Amount');
        console.log(this.usdtAmount);
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        console.log('Quantity');
        console.log(quantity);
        const entryParams = {
            type: 'MARKET',
            workingType: 'MARK_PRICE',
            newClientOrderId: this.entryClientOrderId
        };
        if (quantity < this.symbolInfo.minMarketLotSize) {
            return {
                error: 'SMALL_LOT_SIZE',
                errorMsg: 'Min: ' + this.symbolInfo.minMarketLotSize + '; Current: ' + quantity,
                positionKey: this.positionKey
            };
        }
        if (this.usdtAmount < 5) {
            return { error: 'SMALL_AMOUNT', errorMsg: 'Amount: ' + this.usdtAmount, positionKey: this.positionKey };
        }
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);
        return { entryOrder: entryOrd };
        // return {};
    }
    // WATCH POSITION
    watchPosition() {
        (0, binanceApi_1.priceStream)(this.symbol, price => {
            if (!this.stopLossHasBeenMoved) {
                let changePerc;
                if (this.position === 'long') {
                    changePerc = (+price.markPrice - this.entryPrice) / (this.entryPrice / 100);
                }
                else {
                    changePerc = (this.entryPrice - (+price.markPrice)) / (this.entryPrice / 100);
                }
                if (changePerc >= this.trailingStopTriggerPerc) {
                    this.stopLossHasBeenMoved = true;
                    this.moveStopLoss();
                }
            }
        });
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
            workingType: 'MARK_PRICE',
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
    deletePosition(callback) {
        this.deletePositionCallback = callback;
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map