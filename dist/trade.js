"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPosition = exports._symbols = exports.openedPositions = void 0;
const binanceApi_1 = require("./binance_api/binanceApi");
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./binance_api/symbols"));
const fee = .08, interval = '5m', limit = 100, leverage = 20, maxBotPositions = 2;
exports.openedPositions = {};
let excludedSymbols = new Set();
let botPositions = 0;
let _symbolsObj;
(async function () {
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    exports._symbols = ['GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT']; //symbols, ,'LUNAUSDT','FTMUSDT' , 'MATICUSDT';
    _symbolsObj = symbolsObj;
    (0, CandlesTicksStream_1.CandlesTicksStream)({ symbols: exports._symbols, interval, limit }, null);
    (0, binanceApi_1.ordersUpdateStream)();
    console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
})();
function OpenPosition(s, initiator) {
    const pKey = s.symbol;
    // console.log('******************************************************');
    // console.log('s.symbol', s.symbol);
    // console.log('open positions', Object.keys(openedPositions));
    // console.log('s.resolvePosition', s.resolvePosition);
    // console.log('excludedSymbols', excludedSymbols);
    // console.log('initiator', initiator);
    // console.log('botPositions', botPositions);
    // console.log('s.percentLoss', s.percentLoss);
    // console.log('******************************************************');
    if (exports.openedPositions[pKey]
        || excludedSymbols.has(pKey)
        || !s.resolvePosition
        || (initiator == 'bot' && botPositions >= maxBotPositions)
        || s.percentLoss < fee) {
        return;
    }
    if (initiator == 'bot') {
        botPositions++;
    }
    let trailingStopStartTriggerPricePerc;
    let trailingStopStartOrderPerc;
    let trailingStopTriggerPriceStepPerc;
    let trailingStopOrderDistancePerc;
    let takeProfitPerc;
    let setTakeProfit;
    let useTrailingStop;
    const atrPerc = s.atr / (s.entryPrice / 100);
    if (s.strategy == 'follow_candle') {
        setTakeProfit = true;
        // takeProfitPerc = atrPerc / 5;
        takeProfitPerc = s.percentLoss / 10;
    }
    if (s.strategy == 'traders_force') {
        setTakeProfit = true;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = s.percentLoss / 2;
        trailingStopStartOrderPerc = fee;
        // takeProfitPerc = s.percentLoss / 2;
    }
    if (s.strategy == 'patterns') {
        setTakeProfit = true;
        takeProfitPerc = s.percentLoss;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = (s.percentLoss / 100) * 80;
        trailingStopStartOrderPerc = fee;
    }
    if (s.strategy == 'levels') {
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = s.percentLoss + fee;
        trailingStopStartOrderPerc = fee;
        trailingStopTriggerPriceStepPerc = s.percentLoss;
        trailingStopOrderDistancePerc = s.percentLoss;
    }
    exports.openedPositions[pKey] = new position_1.Position({
        positionKey: pKey,
        position: s.position,
        symbol: s.symbol,
        expectedProfit: s.expectedProfit,
        entryPrice: s.entryPrice,
        takeProfit: s.takeProfit,
        percentLoss: s.percentLoss,
        fee,
        leverage,
        symbols: exports._symbols,
        symbolInfo: _symbolsObj[s.symbol],
        trailingStopStartTriggerPricePerc,
        trailingStopStartOrderPerc,
        trailingStopTriggerPriceStepPerc,
        trailingStopOrderDistancePerc,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator,
        useTrailingStop,
        setTakeProfit,
        takeProfitPerc
    });
    exports.openedPositions[pKey].setOrders();
    // if (s.signal == 'scalping') {
    // } else {
    //     // botPositions[pKey].setEntryOrder().then((res) => {
    //     //     console.log(res);
    //     //     if (res.error) {
    //     //         positions--;
    //     //     }
    //     // });
    // }
    exports.openedPositions[pKey].deletePosition = function (opt) {
        if (opt) {
            if (opt.excludeKey) {
                excludedSymbols.add(opt.excludeKey);
                console.log('EXCLUDED =' + opt.excludeKey);
            }
            else if (opt.clearExcludedSymbols) {
                excludedSymbols.clear();
            }
        }
        if (this.initiator == 'bot') {
            botPositions--;
        }
        console.log('DELETE =' + this.positionKey + '= POSITION OBJECT');
        delete exports.openedPositions[this.positionKey];
    };
    console.log('trade.ts -> OpenPosition -> openedPositions');
    console.log(exports.openedPositions);
}
exports.OpenPosition = OpenPosition;
//# sourceMappingURL=trade.js.map