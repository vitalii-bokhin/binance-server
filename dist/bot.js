"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const chart_1 = require("./chart");
const symbols = require("./data/symbols.json");
const volatility_1 = require("./signals/volatility");
const fee = .1;
chart_1.Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
    (0, volatility_1.Volatility)({ fee, data });
});
function Bot() {
    (0, binanceApi_1.candlesTicksStream)({ symbols: ['BTCUSDT'], interval: '1m', limit: 2 }, (data) => {
        const s = (0, volatility_1.Volatility)({ fee, data });
        console.log(s);
    });
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map