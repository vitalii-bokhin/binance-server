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
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.fee = opt.fee;
        this.usdtAmount = opt.usdtAmount;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopLossDistance = this.fee * 2;
    }
    async setEntryOrder() {
        this.watchPosition();
        this.status = 'pending';
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, 1);
        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            timeInForce: 'GTC'
        };
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);
        // stop loss
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: this.stopLoss
        };
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        this.stopLossClientOrderId = stopOrd.clientOrderId;
        return [entryOrd, stopOrd];
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
                if (changePerc > this.trailingStopLossDistance) {
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
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: 0
        };
        if (this.position === 'long') {
            exitParams.stopPrice = this.entryPrice + (this.fee * (this.entryPrice / 100));
        }
        else {
            exitParams.stopPrice = this.entryPrice - (this.fee * (this.entryPrice / 100));
        }
        ss;
        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);
        await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });
        this.trailingStopLossDistance = this.trailingStopLossDistance + this.fee * 2;
        this.stopLossHasBeenMoved = false;
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map