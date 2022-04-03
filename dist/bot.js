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
const fee = .08;
const botPositions = {};
let positions = 0;
async function Bot() {
    (0, binanceApi_1.ordersUpdateStream)();
    (0, binanceApi_1.tickerStream)();
    const interval = '1m';
    const limit = 50;
    const leverage = 3;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const _symbols = ['1000XECUSDT']; //symbols; //['PEOPLEUSDT'];
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
                    rsiPeriod: s.rsiPeriod
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
                    console.log('DELETE POS');
                    console.log(positionKey);
                    console.log(botPositions[positionKey]);
                    delete botPositions[positionKey];
                    positions--;
                });
                console.log(botPositions);
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