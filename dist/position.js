"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
// const binanceAuth = new Binance().options({
//     APIKEY: BINANCE_KEY,
//     APISECRET: BINANCE_SECRET,
//     useServerTime: true
// });
const binanceAuth = new node_binance_api_1.default();
class Position {
    constructor(opt) {
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
    }
    setEntryOrder() {
        this.status = 'pending';
        const side = this.position === 'long' ? 'BUY' : 'SELL';
        binanceAuth.futuresOrder(side, this.symbol, this.entryPrice);
    }
}
exports.Position = Position;
//# sourceMappingURL=position.js.map