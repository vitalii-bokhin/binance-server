"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageTradeLines = exports.BotControl = exports.Bot = exports.tradeLinesCache = exports.depthCache = exports.controls = void 0;
const DepthStream_1 = require("./binance_api/DepthStream");
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
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
exports.depthCache = {};
exports.tradeLinesCache = {};
async function Bot() {
    if (botIsRun) {
        console.log('Bot was run!');
    }
    else {
        console.log('Bot has been run!');
        botIsRun = true;
        await BotControl();
        await ManageTradeLines();
        (0, CandlesTicksStream_1.CandlesTicksStream)(null, data => {
            (0, strategy_1.Strategy)({
                data,
                symbols: trade_1._symbols,
                tradingSymbols: exports.controls.tradingSymbols,
                tradeLines: exports.tradeLinesCache
            }).then(res => {
                if (exports.controls.resolvePositionMaking) {
                    res.forEach(sym => (0, trade_1.OpenPosition)(sym, 'bot'));
                }
                ev.emit('bot', { strategy: res });
            });
        });
        (0, DepthStream_1.DepthStream)(trade_1._symbols, data => {
            for (const symbol in data) {
                if (Object.prototype.hasOwnProperty.call(data, symbol)) {
                    const dataItem = data[symbol];
                    const asksEstimatePrice = +dataItem.asks[0][0] + (2 * (+dataItem.asks[0][0] / 100));
                    const bidsEstimatePrice = +dataItem.bids[0][0] - (2 * (+dataItem.bids[0][0] / 100));
                    let highA = 0;
                    let priceA;
                    let highB = 0;
                    let priceB;
                    let asksSum = 0;
                    let bidsSum = 0;
                    for (const ask of dataItem.asks) {
                        asksSum += +ask[1];
                        if (+ask[1] > highA) {
                            highA = +ask[1];
                            priceA = ask[0];
                        }
                        if (+ask[0] >= asksEstimatePrice) {
                            break;
                        }
                    }
                    for (const bid of dataItem.bids) {
                        bidsSum += +bid[1];
                        if (+bid[1] > highB) {
                            highB = +bid[1];
                            priceB = bid[0];
                        }
                        if (+bid[0] <= bidsEstimatePrice) {
                            break;
                        }
                    }
                    exports.depthCache[symbol] = {
                        maxAsk: {
                            price: +priceA,
                            volume: highA
                        },
                        maxBid: {
                            price: +priceB,
                            volume: highB
                        },
                        asksSum,
                        bidsSum
                    };
                }
            }
        });
    }
    return ev;
}
exports.Bot = Bot;
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