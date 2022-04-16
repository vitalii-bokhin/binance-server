"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageTradeLines = exports.BotControl = exports.getDepthCache = exports.Bot = exports.tradeLinesCache = void 0;
const binanceApi_1 = require("./binance_api/binanceApi");
const symbols_1 = __importDefault(require("./symbols"));
const strategy_1 = require("./strategy");
const events_1 = __importDefault(require("events"));
const trade_1 = require("./trade");
const db_1 = require("./db/db");
const ev = new events_1.default.EventEmitter();
let botIsRun = false;
const controls = {
    resolvePositionMaking: false
};
const depthCache = {};
exports.tradeLinesCache = {};
async function Bot() {
    if (botIsRun) {
        console.log('Bot was run!');
    }
    else {
        botIsRun = true;
        // tickerStream();
        const { symbols, symbolsObj } = await (0, symbols_1.default)();
        const _symbols = symbols; //['ZILUSDT', 'WAVESUSDT', 'GMTUSDT'];
        (0, binanceApi_1.candlesTicksStream)(null, data => {
            (0, strategy_1.Strategy)({ data, symbols: _symbols }).then(res => {
                if (controls.resolvePositionMaking) {
                    res.forEach(sym => (0, trade_1.OpenPosition)(sym, 'bot'));
                }
                ev.emit('bot', { strategy: res });
            });
        });
        (0, binanceApi_1.DepthStream)(['WAVESUSDT'], data => {
            console.log('RES');
            console.log('ask', data['WAVESUSDT'].asks /* .sort((a, b) => +a[0] - +b[0]) */.slice(0, 5));
            console.log('bid', data['WAVESUSDT'].bids /* .sort((a, b) => +b[0] - +a[0]) */.slice(0, 5));
            let highA = 0;
            let priceA;
            let high = 0;
            let price;
            data['WAVESUSDT'].asks.forEach(it => {
                if (+it[1] > highA) {
                    highA = +it[1];
                    priceA = it[0];
                }
            });
            data['WAVESUSDT'].bids.forEach(it => {
                if (+it[1] > high) {
                    high = +it[1];
                    price = it[0];
                }
            });
            depthCache['WAVESUSDT'] = {
                maxAsk: {
                    price: +priceA,
                    volume: highA
                },
                maxBid: {
                    price: +price,
                    volume: high
                }
            };
        });
    }
    return ev;
}
exports.Bot = Bot;
function getDepthCache(symbol) {
    return depthCache[symbol];
}
exports.getDepthCache = getDepthCache;
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
async function ManageTradeLines(saveReq) {
    if (saveReq) {
        const { type, symbol, opt, removeId } = saveReq;
        let tradeLines = await (0, db_1.GetData)('tradelines');
        if (opt) {
            if (!tradeLines) {
                tradeLines = {};
            }
            if (!tradeLines[symbol]) {
                tradeLines[symbol] = {
                    [type]: [opt]
                };
            }
            else if (!tradeLines[symbol][type]) {
                tradeLines[symbol][type] = [opt];
            }
            else {
                const ids = tradeLines[symbol][type].map(l => l.id);
                if (ids.includes(opt.id)) {
                    tradeLines[symbol][type][ids.indexOf(opt.id)] = opt;
                }
                else {
                    tradeLines[symbol][type].push(opt);
                }
            }
        }
        else if (removeId) {
            let removeIndex = 0;
            tradeLines[symbol][type].forEach((line, i) => {
                if (removeId == line.id) {
                    removeIndex = i;
                }
            });
            tradeLines[symbol][type].splice(removeIndex, 1);
        }
        await (0, db_1.SaveData)('tradelines', tradeLines);
        exports.tradeLinesCache = tradeLines;
    }
    else {
        const tradeLinesData = await (0, db_1.GetData)('tradelines');
        if (tradeLinesData) {
            exports.tradeLinesCache = tradeLinesData;
        }
    }
}
exports.ManageTradeLines = ManageTradeLines;
//# sourceMappingURL=bot.js.map