"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotControl = exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const symbols_1 = __importDefault(require("./symbols"));
const strategy_1 = require("./strategy");
const events_1 = __importDefault(require("events"));
const trade_1 = require("./trade");
const ev = new events_1.default.EventEmitter();
let botIsRun = false;
const controls = {
    resolvePositionMaking: false
};
async function Bot() {
    if (botIsRun) {
        console.log('Bot was run!');
        return ev;
    }
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