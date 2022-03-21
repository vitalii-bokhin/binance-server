"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./symbols"));
const signals_1 = require("./signals");
const fee = .1;
// Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
//     Volatility({ fee, data });
// });
const botPositions = {};
let isPosition = false;
console.log('Bot import');
async function Bot() {
    const interval = '4h';
    const limit = 5;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    console.log('Bot call');
    (0, binanceApi_1.candlesTicksStream)({ symbols, interval, limit }, (data) => {
        (0, signals_1.Aisle)({ fee, limit, data }).then((res) => {
            res.forEach((signal) => {
                const pKey = signal.symbol;
                if (!botPositions[pKey] && !isPosition) {
                    isPosition = true;
                    botPositions[pKey] = new position_1.Position({
                        position: signal.position,
                        symbol: signal.symbol,
                        expectedProfit: signal.expectedProfit,
                        possibleLoss: signal.possibleLoss,
                        entryPrice: signal.entryPrice,
                        stopLoss: signal.stopLoss,
                        fee
                    });
                    console.log(botPositions);
                    botPositions[pKey].setEntryOrder(symbolsObj)
                        .then((res) => {
                        console.log(res);
                    });
                }
            });
        });
    });
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map