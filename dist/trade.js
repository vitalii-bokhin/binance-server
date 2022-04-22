"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPosition = exports._symbols = void 0;
const binanceApi_1 = require("./binance_api/binanceApi");
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./symbols"));
const fee = .08, interval = '5m', limit = 100, leverage = 10;
const openedPositions = {};
const excludedPositions = [];
let botPositions = 0;
let _symbolsObj;
(async function () {
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    exports._symbols = symbols; // ['GMTUSDT', 'ZILUSDT', 'WAVESUSDT', 'MATICUSDT']; //symbols;
    _symbolsObj = symbolsObj;
    (0, CandlesTicksStream_1.CandlesTicksStream)({ symbols: exports._symbols, interval, limit }, null);
    (0, binanceApi_1.ordersUpdateStream)();
    console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
})();
function OpenPosition(s, initiator) {
    const pKey = s.symbol;
    if (openedPositions[pKey]
        || !s.resolvePosition
        || excludedPositions.includes(pKey)
        || (initiator == 'bot' && botPositions >= 1)
        || s.percentLoss < fee) {
        return;
    }
    if (initiator == 'bot') {
        botPositions++;
    }
    let trailingStopStartTriggerPricePerc;
    let trailingStopStartOrderPerc;
    let trailingStopTriggerPriceStepPerc;
    let trailingStopOrderStepPerc;
    if (s.strategy == 'trend') {
        trailingStopStartTriggerPricePerc = .3;
        trailingStopStartOrderPerc = fee;
        trailingStopTriggerPriceStepPerc = s.percentLoss;
        trailingStopOrderStepPerc = s.percentLoss;
    }
    openedPositions[pKey] = new position_1.Position({
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
        trailingStopOrderStepPerc,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator,
        useTrailingStop: s.strategy === 'trend',
        setTakeProfit: s.strategy !== 'trend'
    });
    openedPositions[pKey].setOrders().then(res => {
        console.log(res);
    });
    // if (s.signal == 'scalping') {
    // } else {
    //     // botPositions[pKey].setEntryOrder().then((res) => {
    //     //     console.log(res);
    //     //     if (res.error) {
    //     //         positions--;
    //     //     }
    //     // });
    // }
    openedPositions[pKey].deletePosition = function (opt) {
        if (opt && opt.excludeKey) {
            excludedPositions.push(opt.excludeKey);
            console.log('EXCLUDED =' + this.positionKey);
        }
        delete openedPositions[this.positionKey];
        if (this.initiator == 'bot') {
            botPositions--;
        }
        console.log('DELETE =' + this.positionKey + '= POSITION OBJECT');
    };
    console.log(openedPositions);
}
exports.OpenPosition = OpenPosition;
//# sourceMappingURL=trade.js.map