"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenPosition = void 0;
const binanceApi_1 = require("./binance_api/binanceApi");
const position_1 = require("./position");
const symbols_1 = __importDefault(require("./symbols"));
const fee = .08, interval = '5m', limit = 72, leverage = 5;
const openedPositions = {};
const excludedPositions = [];
let botPositions = 0;
let _symbols, _symbolsObj;
(async function () {
    const { symbols, symbolsObj } = await (0, symbols_1.default)();
    _symbols = symbols; //['ZILUSDT', 'WAVESUSDT', 'GMTUSDT'];
    _symbolsObj = symbolsObj;
    (0, binanceApi_1.candlesTicksStream)({ symbols: _symbols, interval, limit }, null);
    (0, binanceApi_1.ordersUpdateStream)();
    console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
})();
function OpenPosition(s, initiator) {
    const pKey = s.symbol;
    if (openedPositions[pKey] ||
        !s.resolvePosition ||
        excludedPositions.includes(pKey) ||
        (initiator == 'bot' && botPositions == 2) ||
        s.percentLoss < fee) {
        return;
    }
    if (initiator == 'bot') {
        botPositions++;
    }
    let trailingStopStartTriggerPrice;
    let trailingStopStartOrder;
    let trailingStopTriggerPriceStep;
    let trailingStopOrderStep;
    if (s.strategy == 'aisle' || s.strategy == 'manual') {
        trailingStopStartTriggerPrice = s.percentLoss;
        trailingStopStartOrder = s.percentLoss / 2;
        trailingStopTriggerPriceStep = s.percentLoss;
        trailingStopOrderStep = s.percentLoss;
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
        symbols: _symbols,
        symbolInfo: _symbolsObj[s.symbol],
        trailingStopStartTriggerPrice,
        trailingStopStartOrder,
        trailingStopTriggerPriceStep,
        trailingStopOrderStep,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator
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
    openedPositions[pKey].deletePosition = function (positionKey, opt) {
        if (opt && opt.excludeKey) {
            excludedPositions.push(opt.excludeKey);
            console.log('EXCLUDED =' + this.positionKey);
        }
        delete openedPositions[positionKey];
        if (this.initiator == 'bot') {
            botPositions--;
        }
        console.log('DELETE =' + positionKey + '= POSITION OBJECT');
    };
}
exports.OpenPosition = OpenPosition;
//# sourceMappingURL=trade.js.map