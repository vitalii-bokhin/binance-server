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
const fee = .08, interval = '5m', limit = 72, leverage = 5;
const botPositions = {};
const excludedPositions = [];
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
    console.log(`Bot has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
    botIsRun = true;
    (0, binanceApi_1.ordersUpdateStream)();
    (0, binanceApi_1.tickerStream)();
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    const _symbols = ['ZILUSDT', 'WAVESUSDT', 'GMTUSDT'];
    const setPosition = function (s) {
        const pKey = s.symbol;
        if (excludedPositions.includes(pKey)) {
            return;
        }
        if (!botPositions[pKey] && positions < 2 && s.resolvePosition && s.percentLoss > fee) {
            positions++;
            let trailingStopStartTriggerPrice;
            let trailingStopStartOrder;
            let trailingStopTriggerPriceStep;
            let trailingStopOrderStep;
            if (s.strategy == 'aisle') {
                trailingStopStartTriggerPrice = s.percentLoss;
                trailingStopStartOrder = s.percentLoss / 2;
                trailingStopTriggerPriceStep = s.percentLoss;
                trailingStopOrderStep = s.percentLoss;
            }
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
                trailingStopStartTriggerPrice,
                trailingStopStartOrder,
                trailingStopTriggerPriceStep,
                trailingStopOrderStep,
                signal: s.signal,
                interval,
                limit,
                rsiPeriod: s.rsiPeriod,
                signalDetails: s.signalDetails
            });
            botPositions[pKey].setOrders();
            // if (s.signal == 'scalping') {
            // } else {
            //     // botPositions[pKey].setEntryOrder().then((res) => {
            //     //     console.log(res);
            //     //     if (res.error) {
            //     //         positions--;
            //     //     }
            //     // });
            // }
            botPositions[pKey].deletePosition = function (positionKey, opt) {
                if (opt && opt.excludeKey) {
                    excludedPositions.push(opt.excludeKey);
                    console.log('EXCLUDED =' + positionKey);
                }
                delete botPositions[positionKey];
                positions--;
                console.log('DELETE =' + positionKey + '= POSITION OBJECT');
            };
        }
    };
    (0, binanceApi_1.candlesTicksStream)({ symbols: _symbols, interval, limit }, data => {
        (0, strategy_1.Strategy)({ data, symbols: _symbols }).then(res => {
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