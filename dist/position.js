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
// const binanceAuth = new Binance();
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
        this.fee = opt.fee;
        this.usdtAmount = opt.usdtAmount;
        this.leverage = opt.leverage;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopLossTriggerPerc = .3; // first trailing move
        this.trailingStopLossPerc = .1; // first trailing move
        this.trailingStopLossStepPerc = opt.trailingStopLossStepPerc;
        this.signal = opt.signal;
    }
    async setEntryOrder() {
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
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
                if (changePerc > this.trailingStopLossTriggerPerc) {
                    this.stopLossHasBeenMoved = true;
                    this.moveStopLoss();
                }
            }
        });
        (0, binanceApi_1.positionUpdateStream)(this.symbol, pos => {
            console.log('--position--');
            console.log(pos);
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
            exitParams.stopPrice = this.entryPrice + (this.trailingStopLossPerc * (this.entryPrice / 100));
        }
        else {
            exitParams.stopPrice = this.entryPrice - (this.trailingStopLossPerc * (this.entryPrice / 100));
        }
        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        this.stopLossClientOrderId = stopOrd.clientOrderId;
        this.trailingStopLossTriggerPerc = this.trailingStopLossTriggerPerc + this.trailingStopLossStepPerc;
        this.trailingStopLossPerc = this.trailingStopLossPerc + this.trailingStopLossStepPerc;
        this.stopLossHasBeenMoved = false;
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map