"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotControl = exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./symbols"));
const strategy_1 = require("./strategy");
const events_1 = __importDefault(require("events"));
const fee = .08;
const botPositions = {};
const ev = new events_1.default.EventEmitter();
let positions = 0;
let botIsRun = false;
const controls = {
    resolvePositionMaking: false
};
async function Bot() {
    if (botIsRun) {
        console.log('Bot was run!');
        return ev;
    }
    console.log('Bot has been run.');
    botIsRun = true;
    (0, binanceApi_1.ordersUpdateStream)();
    (0, binanceApi_1.tickerStream)();
    const interval = '5m';
    const limit = 100;
    const leverage = 3;
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const _symbols = symbols; //['ZILUSDT', 'WAVESUSDT', 'GMTUSDT']; //symbols; //['PEOPLEUSDT'];
    const setPosition = function (s) {
        const pKey = s.symbol;
        if (!botPositions[pKey] && positions < 2 && s.resolvePosition) {
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
                    console.log({ error: '' });
                    if (res.error) {
                        console.log({ error: new Error(res.errorMsg) });
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
                console.log({ posMsg: 'DELETE POS', scalpOrder: '' });
                delete botPositions[positionKey];
                positions--;
            };
        }
    };
    (0, binanceApi_1.candlesTicksStream)({ symbols: _symbols, interval, limit }, data => {
        (0, strategy_1.Strategy)({ fee, limit, data }).then(res => {
            if (controls.resolvePositionMaking) {
                res.forEach(setPosition);
            }
            ev.emit('bot', { strategy: res, botPositions });
        });
    });
    return ev;
}
exports.Bot = Bot;
function BotControl(req) {
    if (req) {
        for (const key in req) {
            if (Object.prototype.hasOwnProperty.call(req, key)) {
                controls[key] = req[key];
            }
        }
    }
    return controls;
}
exports.BotControl = BotControl;
//# sourceMappingURL=bot.js.map