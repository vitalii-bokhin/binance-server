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
const botPositions = {};
let positions = 0;
async function Bot() {
    const interval = '1h';
    const limit = 3;
    const usdtAmount = 10;
    const leverage = 2;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const setPosition = res => {
        res.forEach(s => {
            const pKey = s.symbol;
            if (!botPositions[pKey] && positions < 2) {
                positions++;
                let trailingStopLossStepPerc = .1;
                if (s.expectedProfit !== undefined) {
                    trailingStopLossStepPerc = s.expectedProfit < 1 ? s.expectedProfit : s.expectedProfit / 2;
                }
                botPositions[pKey] = new position_1.Position({
                    positionKey: pKey,
                    position: s.position,
                    symbol: s.symbol,
                    expectedProfit: s.expectedProfit,
                    possibleLoss: s.possibleLoss,
                    entryPrice: s.entryPrice,
                    stopLoss: s.stopLoss,
                    fee,
                    usdtAmount,
                    leverage,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopLossStepPerc,
                    signal: s.signal
                });
                console.log(botPositions);
                botPositions[pKey].setEntryOrder()
                    .then((res) => {
                    console.log(res);
                    if (res.error) {
                        positions--;
                    }
                });
            }
        });
    };
    (0, binanceApi_1.candlesTicksStream)({ symbols, interval, limit }, data => {
        (0, signals_1.Signals)({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map