"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("./config");
const binanceAuth = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
// const binanceAuth = new Binance();
class Position {
    constructor(opt) {
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
    }
    async setEntryOrder(symbolsObj) {
        this.status = 'pending';
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(6 / this.entryPrice).toFixed(symbolsObj[this.symbol].quantityPrecision);
        const entryParams = {
            timeInForce: 'GTC'
        };
        const lvr = await binanceAuth.futuresLeverage(this.symbol, 1);
        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: this.stopLoss
        };
        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);
        return [entryOrd, stopOrd];
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map