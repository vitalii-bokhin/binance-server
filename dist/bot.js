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
const fee = .08;
const botPositions = {};
let positions = 0;
async function Bot() {
    (0, binanceApi_1.ordersUpdateStream)();
    const interval = '5m';
    const limit = 25;
    const usdtAmount = 10;
    const leverage = 2;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const setPosition = res => {
        res.forEach(s => {
            const pKey = s.symbol;
            if (!botPositions[pKey] && positions < 1) {
                positions++;
                let trailingStopTriggerPerc;
                let trailingStopPricePerc;
                let trailingStepPerc;
                // if (s.signal == 'scalping') {
                //     trailingStopTriggerPerc = .4;
                //     trailingStopPricePerc = .2;
                //     trailingStepPerc = .1;
                // }
                botPositions[pKey] = new position_1.Position({
                    positionKey: pKey,
                    position: s.position,
                    symbol: s.symbol,
                    expectedProfit: s.expectedProfit,
                    possibleLoss: s.possibleLoss,
                    entryPrice: s.entryPrice,
                    takeProfit: s.takeProfit,
                    stopLoss: s.stopLoss,
                    fee,
                    usdtAmount,
                    leverage,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopTriggerPerc,
                    trailingStopPricePerc,
                    trailingStepPerc,
                    signal: s.signal
                });
                if (s.signal == 'scalping') {
                    botPositions[pKey].setScalpingOrders().then((res) => {
                        console.log(res);
                        if (res.error) {
                            positions--;
                        }
                    });
                }
                else {
                    botPositions[pKey].setEntryOrder().then((res) => {
                        console.log(res);
                        if (res.error) {
                            positions--;
                        }
                    });
                }
                botPositions[pKey].deletePosition(positionKey => {
                    delete botPositions[positionKey];
                    positions--;
                });
                console.log(botPositions);
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