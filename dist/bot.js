"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./symbols"));
const strategy_1 = require("./strategy");
const console_1 = require("./console");
const fee = .08;
const botPositions = {};
let positions = 0;
async function Bot() {
    (0, binanceApi_1.ordersUpdateStream)();
    (0, binanceApi_1.tickerStream)();
    const interval = '5m';
    const limit = 50;
    const leverage = 3;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const _symbols = ['ZILUSDT', 'WAVESUSDT']; //symbols; //['PEOPLEUSDT'];
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
                    entryPrice: s.entryPrice,
                    takeProfit: s.takeProfit,
                    percentLoss: s.percentLoss,
                    fee,
                    leverage,
                    symbols: _symbols,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopTriggerPerc,
                    trailingStopPricePerc,
                    trailingStepPerc,
                    signal: s.signal,
                    interval,
                    limit,
                    rsiPeriod: s.rsiPeriod,
                    signalDetails: s.signalDetails
                });
                if (s.signal == 'scalping') {
                    botPositions[pKey].setScalpingOrders().then((res) => {
                        (0, console_1.consoleLog)({ error: '' });
                        if (res.error) {
                            (0, console_1.consoleLog)({ error: new Error(res.errorMsg) });
                        }
                    });
                }
                else {
                    // botPositions[pKey].setEntryOrder().then((res) => {
                    //     console.log(res);
                    //     if (res.error) {
                    //         positions--;
                    //     }
                    // });
                }
                botPositions[pKey].deletePosition = function (positionKey) {
                    (0, console_1.consoleLog)({ posMsg: 'DELETE POS', scalpOrder: '' });
                    delete botPositions[positionKey];
                    positions--;
                };
                (0, console_1.consoleLog)({ botPositions });
            }
        });
    };
    (0, binanceApi_1.candlesTicksStream)({ symbols: _symbols, interval, limit }, data => {
        (0, strategy_1.Strategy)({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map