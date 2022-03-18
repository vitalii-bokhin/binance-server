"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bot = void 0;
const binanceApi_1 = require("./binanceApi");
const chart_1 = require("./chart");
const symbols = require("./data/symbols.json");
const position_1 = require("./position");
const volatility_1 = require("./signals/volatility");
const fee = .1;
chart_1.Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
    (0, volatility_1.Volatility)({ fee, data });
});
const botPositions = {};
function Bot() {
    const interval = '1h';
    const limit = 2;
    (0, binanceApi_1.candlesTicksStream)({ symbols, interval, limit }, (data) => {
        (0, volatility_1.Volatility)({ fee, data })
            .then((res) => {
            res.forEach((signal) => {
                const pKey = [signal.symbol, interval, limit].join('_');
                if (!botPositions[pKey]) {
                    botPositions[pKey] = new position_1.Position({
                        position: signal.position,
                        symbol: signal.symbol,
                        expectedProfit: signal.expectedProfit,
                        possibleLoss: signal.possibleLoss,
                        entryPrice: signal.entryPrice,
                        stopLoss: signal.stopLoss,
                    });
                    botPositions[pKey].setEntryOrder();
                }
                console.log(signal);
            });
        });
    });
}
exports.Bot = Bot;
//# sourceMappingURL=bot.js.map