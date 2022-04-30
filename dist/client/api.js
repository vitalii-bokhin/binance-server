"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CandlesTicksStream_1 = require("../binance_api/CandlesTicksStream");
const bot_1 = require("../bot");
const manual_1 = require("../manual");
const strategy_1 = require("../strategy");
const symbols_1 = __importDefault(require("../binance_api/symbols"));
const trade_1 = require("../trade");
function default_1(api) {
    api.get('/bot', async (req, res) => {
        await (0, bot_1.Bot)();
        const { resolvePositionMaking, tradingSymbols } = await (0, bot_1.BotControl)();
        res.json({
            status: 'Start connect',
            availableSymbols: trade_1._symbols,
            resolvePositionMaking,
            tradingSymbols,
        });
    });
    api.post('/bot', async (req, res) => {
        if (req.body.reuseStrategy) {
            (0, strategy_1.ReuseStrategy)();
            res.json({ status: 'OK' });
        }
        else {
            await (0, bot_1.BotControl)(req.body);
            res.json({ status: 'Controls' });
        }
    });
    api.ws('/bot', (ws, req) => {
        const botEvHandler = function (msg) {
            const res = {
                status: 'On run',
                strategy: msg.strategy,
                positions: []
            };
            // msg.strategy.forEach((arg: any) => {
            //     if (arg.symbol == 'XEMUSDT') {
            //         console.log(arg.entryPrice);
            //     }
            // });
            for (const key in msg.botPositions) {
                if (Object.prototype.hasOwnProperty.call(msg.botPositions, key)) {
                    res.positions.push(msg.botPositions[key]);
                }
            }
            ws.send(JSON.stringify(res));
        };
        (0, bot_1.Bot)().then(ev => {
            ev.on('bot', botEvHandler);
            ws.on('close', () => {
                ev.off('bot', botEvHandler);
            });
        });
    });
    api.get('/trade', (req, res) => {
        (0, symbols_1.default)().then(({ symbols, symbolsObj }) => {
            res.json({ symbols });
        });
    });
    api.post('/trade', (req, res) => {
        (0, manual_1.ImmediatelyPosition)(req.body);
        res.json(req.body);
    });
    api.get('/candlesticks', (req, res) => {
        res.json([]);
        // Chart.candlesTicks(req.query, function (data: any) {
        //         res.json(data);
        // });
    });
    api.ws('/candlesticks', (ws, req) => {
        const symbol = req.query.symbol;
        (0, CandlesTicksStream_1.symbolCandlesTicksStream)(symbol, data => {
            ws.send(JSON.stringify(data));
        });
    });
    api.get('/tradelines', async (req, res) => {
        await (0, bot_1.ManageTradeLines)();
        res.json(bot_1.tradeLinesCache);
    });
    api.post('/tradelines', async (req, res) => {
        await (0, bot_1.ManageTradeLines)(req.body);
        res.json(bot_1.tradeLinesCache);
    });
    return api;
}
exports.default = default_1;
//# sourceMappingURL=api.js.map