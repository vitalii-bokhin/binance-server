"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPosition = exports._symbols = exports.openedPositions = void 0;
const PositionEmulation_1 = require("./PositionEmulation");
const fee = .08, interval = '1h', limit = 99, // candles ticks limit
leverage = 20, maxBotPositions = 7, lossAmount = 1;
exports.openedPositions = {};
let excludedSymbols = new Set();
let botPositions = 0;
let _symbolsObj;
// (async function () {
//     const { symbols, symbolsObj } = await getSymbols();
//     _symbols = ['GALUSDT', 'MANAUSDT', 'GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT', 'FTMUSDT', 'MATICUSDT'];
//     _symbolsObj = symbolsObj;
//     CandlesTicksStream({ symbols: _symbols, interval, limit }, null);
//     ordersUpdateStream();
//     console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
// })();
function openPosition(s, initiator) {
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
    }
    if (s.strategy == 'manual' || s.strategy == 'levels') {
        setTakeProfit = true;
        takeProfitPerc = s.percentLoss;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = s.percentLoss / 2;
        trailingStopStartOrderPerc = fee;
    }
    // if (s.strategy == 'levels') {
    //     setTakeProfit = true;
    //     takeProfitPerc = s.percentLoss;
    //     useTrailingStop = true;
    //     trailingStopStartTriggerPricePerc = s.percentLoss * .5;
    //     trailingStopStartOrderPerc = s.percentLoss * -0.5;
    //     trailingStopTriggerPriceStepPerc = s.percentLoss * .4;
    //     trailingStopOrderDistancePerc = s.percentLoss * .9;
    // }
    // openedPositions[pKey] = new Position({
    //     positionKey: pKey,
    //     position: s.position,
    //     symbol: s.symbol,
    //     expectedProfit: s.expectedProfit,
    //     entryPrice: s.entryPrice,
    //     takeProfit: s.takeProfit,
    //     percentLoss: s.percentLoss,
    //     fee,
    //     leverage,
    //     symbols: _symbols,
    //     symbolInfo: _symbolsObj[s.symbol],
    //     trailingStopStartTriggerPricePerc,
    //     trailingStopStartOrderPerc,
    //     trailingStopTriggerPriceStepPerc,
    //     trailingStopOrderDistancePerc,
    //     signal: s.signal,
    //     interval,
    //     limit,
    //     rsiPeriod: s.rsiPeriod,
    //     signalDetails: s.signalDetails,
    //     initiator,
    //     useTrailingStop,
    //     setTakeProfit,
    //     takeProfitPerc,
    //     lossAmount
    // });
    exports.openedPositions[pKey] = new PositionEmulation_1.PositionEmulation({
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
        takeProfitPerc,
        lossAmount
    });
    exports.openedPositions[pKey].setOrders();
    exports.openedPositions[pKey].deletePosition = function (opt) {
        if (opt) {
            if (opt.excludeKey && this.initiator == 'bot') {
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
exports.openPosition = openPosition;
//# sourceMappingURL=index.js.map