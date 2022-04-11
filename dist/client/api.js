"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../bot");
const manual_1 = require("../manual");
const symbols_1 = __importDefault(require("../symbols"));
function default_1(api) {
    api.get('/bot', function (req, res) {
        const controls = (0, bot_1.BotControl)();
        res.json({
            status: 'Start connect',
            controls
        });
    });
    api.post('/bot', function (req, res) {
        const controls = (0, bot_1.BotControl)(req.body);
        res.json({ controls });
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
    api.get('/trade', function (req, res) {
        (0, symbols_1.default)().then(({ symbols, symbolsObj }) => {
            res.json({ symbols });
        });
    });
    api.post('/trade', function (req, res) {
        (0, manual_1.ImmediatelyPosition)(req.body);
        res.json(req.body);
    });
    /* api.get('/candlesticks', (req: { query: any; }, res: { json: (arg0: any) => void; }) => {
        // Chart.candlesTicks(req.query, function (data: any) {
            //     res.json(data);
        // });
    }); */
    return api;
}
exports.default = default_1;
//# sourceMappingURL=api.js.map