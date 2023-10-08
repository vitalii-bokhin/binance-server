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
function ImmediatelyPosition({ symbol, position, stopLoss, onePercLoss }) {
    return __awaiter(this, void 0, void 0, function* () {
        const price = yield binance.futuresMarkPrice(symbol);
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
    });
}
exports.ImmediatelyPosition = ImmediatelyPosition;
//# sourceMappingURL=manual.js.map