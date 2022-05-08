"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runTradeListStream = exports.tradeListCache = exports.runDepthStream = exports.depthCache = exports.ManageTradeLines = exports.BotControl = exports.Bot = exports.tradeLinesCache = exports.controls = void 0;
const DepthStream_1 = require("./binance_api/DepthStream");
const CandlesTicksStream_1 = require("./binance_api/CandlesTicksStream");
const strategy_1 = require("./strategy");
const events_1 = __importDefault(require("events"));
const trade_1 = require("./trade");
const db_1 = require("./db/db");
const binance_api_1 = require("./binance_api");
const ev = new events_1.default.EventEmitter();
let botIsRun = false;
exports.controls = {
    resolvePositionMaking: false,
    tradingSymbols: []
};
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
                    for (const signal of res) {
                        (0, trade_1.OpenPosition)(signal, 'bot');
                    }
                }
                // ev.emit('bot', { strategy: res });
            });
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
        const { obj, removeId, removeAll } = saveReq;
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
        else if (removeAll) {
            const survivors = [];
            for (const tLine of tradeLines) {
                if (removeAll !== tLine.symbol) {
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
let depthStreamHasBeenRun = false;
exports.depthCache = {};
function runDepthStream() {
    if (depthStreamHasBeenRun) {
        return;
    }
    depthStreamHasBeenRun = true;
    (0, DepthStream_1.DepthStream)(trade_1._symbols, data => {
        for (const symbol in data) {
            if (Object.prototype.hasOwnProperty.call(data, symbol)) {
                const dataItem = data[symbol];
                const asksEstimatePrice = +dataItem.asks[0][0] + (5 * (+dataItem.asks[0][0] / 100));
                const bidsEstimatePrice = +dataItem.bids[0][0] - (5 * (+dataItem.bids[0][0] / 100));
                let highA = 0;
                let priceA;
                let highB = 0;
                let priceB;
                let prevHighA;
                let prevPriceA;
                let prevHighB;
                let prevPriceB;
                let asksSum = 0;
                let bidsSum = 0;
                let bestAsk;
                let bestBid;
                let prevBestAsk;
                let prevBestBid;
                bestAsk = +dataItem.asks[0][0];
                bestBid = +dataItem.bids[0][0];
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
                if (exports.depthCache[symbol]) {
                    if (exports.depthCache[symbol].maxAsk.price != +priceA) {
                        prevPriceA = exports.depthCache[symbol].maxAsk.price;
                        prevHighA = exports.depthCache[symbol].maxAsk.volume;
                    }
                    else {
                        prevPriceA = exports.depthCache[symbol].prevMaxAsk.price;
                        prevHighA = exports.depthCache[symbol].prevMaxAsk.volume;
                    }
                    if (exports.depthCache[symbol].maxBid.price != +priceB) {
                        prevPriceB = exports.depthCache[symbol].maxBid.price;
                        prevHighB = exports.depthCache[symbol].maxBid.volume;
                    }
                    else {
                        prevPriceB = exports.depthCache[symbol].prevMaxBid.price;
                        prevHighB = exports.depthCache[symbol].prevMaxBid.volume;
                    }
                    if (exports.depthCache[symbol].bestAsk != bestAsk) {
                        prevBestAsk = exports.depthCache[symbol].bestAsk;
                    }
                    else {
                        prevBestAsk = exports.depthCache[symbol].prevBestAsk;
                    }
                    if (exports.depthCache[symbol].bestBid != bestBid) {
                        prevBestBid = exports.depthCache[symbol].bestBid;
                    }
                    else {
                        prevBestBid = exports.depthCache[symbol].prevBestBid;
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
                    prevMaxAsk: {
                        price: prevPriceA,
                        volume: prevHighA
                    },
                    prevMaxBid: {
                        price: prevPriceB,
                        volume: prevHighB
                    },
                    asksSum,
                    bidsSum,
                    bestAsk,
                    bestBid,
                    prevBestAsk,
                    prevBestBid
                };
            }
        }
    });
}
exports.runDepthStream = runDepthStream;
let tradeListStreamHasBeenRun = false;
exports.tradeListCache = {};
function runTradeListStream() {
    if (tradeListStreamHasBeenRun) {
        return;
    }
    tradeListStreamHasBeenRun = true;
    (0, binance_api_1.TradesListStream)(trade_1._symbols, data => {
        if (!exports.tradeListCache[data.symbol]) {
            exports.tradeListCache[data.symbol] = {
                buyVol: !data.isBuyerMaker ? 0 : +data.qty,
                sellVol: data.isBuyerMaker ? +data.qty : 0,
                prevBuyVol: null,
                prevSellVol: null,
                count: 0
            };
        }
        else {
            exports.tradeListCache[data.symbol].count++;
            if (data.isBuyerMaker) {
                exports.tradeListCache[data.symbol].sellVol += +data.qty;
            }
            else {
                exports.tradeListCache[data.symbol].buyVol += +data.qty;
            }
            if (exports.tradeListCache[data.symbol].count >= 2) {
                exports.tradeListCache[data.symbol].prevBuyVol = exports.tradeListCache[data.symbol].buyVol;
                exports.tradeListCache[data.symbol].prevSellVol = exports.tradeListCache[data.symbol].sellVol;
                exports.tradeListCache[data.symbol].buyVol = 0;
                exports.tradeListCache[data.symbol].sellVol = 0;
                exports.tradeListCache[data.symbol].count = 0;
            }
        }
    });
}
exports.runTradeListStream = runTradeListStream;
//# sourceMappingURL=bot.js.map