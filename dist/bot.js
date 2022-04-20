"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageTradeLines = exports.BotControl = exports.getDepthCache = exports.Bot = exports.tradeLinesCache = exports.controls = void 0;
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const symbols_1 = __importDefault(require("./symbols"));
const strategy_1 = require("./strategy");
const events_1 = __importDefault(require("events"));
const trade_1 = require("./trade");
const db_1 = require("./db/db");
const ev = new events_1.default.EventEmitter();
let botIsRun = false;
exports.controls = {
    resolvePositionMaking: false,
    tradingSymbols: []
};
const depthCache = {};
exports.tradeLinesCache = {};
async function Bot() {
    if (botIsRun) {
        console.log('Bot was run!');
    }
    else {
        console.log('Bot has been run!');
        botIsRun = true;
        // tickerStream();
        const { symbols, symbolsObj } = await (0, symbols_1.default)();
        await BotControl();
        await ManageTradeLines();
        const _symbols = symbols;
        (0, CandlesTicksStream_1.CandlesTicksStream)(null, data => {
            (0, strategy_1.Strategy)({
                data,
                symbols: _symbols,
                tradingSymbols: exports.controls.tradingSymbols,
                tradeLines: exports.tradeLinesCache
            }).then(res => {
                if (exports.controls.resolvePositionMaking) {
                    res.forEach(sym => (0, trade_1.OpenPosition)(sym, 'bot'));
                }
                ev.emit('bot', { strategy: res });
            });
        });
        // DepthStream(['WAVESUSDT'], data => {
        //     console.log('RES');
        //     console.log('ask', data['WAVESUSDT'].asks/* .sort((a, b) => +a[0] - +b[0]) */.slice(0, 5));
        //     console.log('bid', data['WAVESUSDT'].bids/* .sort((a, b) => +b[0] - +a[0]) */.slice(0, 5));
        //     let highA: number = 0;
        //     let priceA: string;
        //     let high: number = 0;
        //     let price: string;
        //     data['WAVESUSDT'].asks.forEach(it => {
        //         if (+it[1] > highA) {
        //             highA = +it[1];
        //             priceA = it[0];
        //         }
        //     });
        //     data['WAVESUSDT'].bids.forEach(it => {
        //         if (+it[1] > high) {
        //             high = +it[1];
        //             price = it[0];
        //         }
        //     });
        //     depthCache['WAVESUSDT'] = {
        //         maxAsk: {
        //             price: +priceA,
        //             volume: highA
        //         },
        //         maxBid: {
        //             price: +price,
        //             volume: high
        //         }
        //     };
        // });
    }
    return ev;
}
exports.Bot = Bot;
function getDepthCache(symbol) {
    return depthCache[symbol];
}
exports.getDepthCache = getDepthCache;
async function BotControl(req) {
    let botControls = await (0, db_1.GetData)('botcontrols');
    if (!botControls) {
        botControls = exports.controls;
    }
    if (req) {
        for (const key in req) {
            if (Object.prototype.hasOwnProperty.call(req, key)) {
                botControls[key] = req[key];
            }
        }
        await (0, db_1.SaveData)('botcontrols', botControls);
    }
    exports.controls = botControls;
    return botControls;
}
exports.BotControl = BotControl;
async function ManageTradeLines(saveReq) {
    let tradeLines = await (0, db_1.GetData)('tradelines');
    if (saveReq) {
        const { obj, removeId } = saveReq;
        if (obj) {
            if (!obj.symbol) {
                return;
            }
            if (tradeLines && tradeLines.length) {
                let isNew = true;
                for (const tLine of tradeLines) {
                    if (obj.id == tLine.id) {
                        isNew = false;
                        if (obj.type == 'levels') {
                            tLine.price = obj.price;
                        }
                        else if (obj.type == 'trends') {
                            tLine.lines = obj.lines;
                        }
                    }
                }
                if (isNew) {
                    if (obj.type == 'levels') {
                        tradeLines.push({
                            id: obj.id,
                            symbol: obj.symbol,
                            type: obj.type,
                            price: obj.price
                        });
                    }
                    else if (obj.type == 'trends') {
                        tradeLines.push({
                            id: obj.id,
                            symbol: obj.symbol,
                            type: obj.type,
                            lines: obj.lines
                        });
                    }
                }
            }
            else {
                tradeLines = [];
                if (obj.type == 'levels') {
                    tradeLines.push({
                        id: obj.id,
                        symbol: obj.symbol,
                        type: obj.type,
                        price: obj.price
                    });
                }
                else if (obj.type == 'trends') {
                    tradeLines.push({
                        id: obj.id,
                        symbol: obj.symbol,
                        type: obj.type,
                        lines: obj.lines
                    });
                }
            }
        }
        else if (removeId) {
            const survivors = [];
            for (const tLine of tradeLines) {
                if (removeId !== tLine.id) {
                    survivors.push(tLine);
                }
            }
            tradeLines = survivors;
        }
        await (0, db_1.SaveData)('tradelines', tradeLines);
    }
    // get to cache
    exports.tradeLinesCache = {};
    if (tradeLines && tradeLines.length) {
        for (const tLine of tradeLines) {
            if (!exports.tradeLinesCache[tLine.symbol]) {
                exports.tradeLinesCache[tLine.symbol] = {
                    levels: [],
                    trends: []
                };
            }
            if (tLine.type == 'levels') {
                exports.tradeLinesCache[tLine.symbol].levels.push({
                    price: tLine.price,
                    id: tLine.id
                });
            }
            else if (tLine.type == 'trends') {
                exports.tradeLinesCache[tLine.symbol].trends.push({
                    lines: tLine.lines,
                    id: tLine.id
                });
            }
        }
    }
}
exports.ManageTradeLines = ManageTradeLines;
//# sourceMappingURL=bot.js.map