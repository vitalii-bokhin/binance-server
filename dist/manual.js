"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImmediatelyPosition = void 0;
const trade_1 = require("./trade");
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const binance = new node_binance_api_1.default().options({
    useServerTime: true
});
async function ImmediatelyPosition({ symbol, position, stopLoss, onePercLoss }) {
    const price = await binance.futuresMarkPrice(symbol);
    const lastPrice = +price.indexPrice;
    let percentLoss;
    if (position == 'long') {
        percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
    }
    else if (position == 'short') {
        percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
    }
    (0, trade_1.OpenPosition)({
        entryPrice: lastPrice,
        position,
        strategy: 'manual',
        symbol,
        resolvePosition: true,
        percentLoss
    }, 'user');
}
exports.ImmediatelyPosition = ImmediatelyPosition;
//# sourceMappingURL=manual.js.map