"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const CandlesTicksStream_1 = require("../binance_api/CandlesTicksStream");
const bot_1 = require("../bot");
const manual_1 = require("../manual");
const strategy_1 = require("../strategy");
const trade_1 = require("../trade");
const positions_1 = require("../positions");
function default_1(api) {
    api.get('/bot', (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield (0, bot_1.Bot)();
        const { resolvePositionMaking, tradingSymbols } = yield (0, bot_1.BotControl)();
        res.json({
            status: 'Start connect',
            availableSymbols: trade_1._symbols,
            resolvePositionMaking,
            tradingSymbols,
        });
    }));
    api.post('/bot', (req, res) => __awaiter(this, void 0, void 0, function* () {
        if (req.body.reuseStrategy) {
            (0, strategy_1.ReuseStrategy)();
            res.json({ status: 'OK' });
        }
        else {
            yield (0, bot_1.BotControl)(req.body);
            res.json({ status: 'Controls' });
        }
    }));
    api.ws('/bot', (ws, req) => {
        const botEvHandler = function (msg) {
            const res = {
                status: 'On run',
                strategy: msg.strategy,
                positions: [],
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
        res.json({ symbols: trade_1._symbols });
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
        CandlesTicksStream_1.candlesTicksEvent.on(symbol, data => {
            ws.send(JSON.stringify(data));
        });
    });
    api.get('/tradelines', (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield (0, bot_1.ManageTradeLines)();
        res.json(bot_1.tradeLinesCache);
    }));
    api.post('/tradelines', (req, res) => __awaiter(this, void 0, void 0, function* () {
        yield (0, bot_1.ManageTradeLines)(req.body);
        res.json(bot_1.tradeLinesCache);
    }));
    api.get('/positions', (req, res) => __awaiter(this, void 0, void 0, function* () {
        const positions = [];
        positions_1.openedPositions.forEach((item) => {
            positions.push({
                symbol: item.symbol,
                entryPrice: item.entryPrice,
                stopLoss: item.stopLoss,
                takeProfit: item.takeProfit,
            });
        });
        res.json(positions);
    }));
    return api;
}
exports.default = default_1;
//# sourceMappingURL=api.js.map