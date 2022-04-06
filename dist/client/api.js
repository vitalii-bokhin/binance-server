"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bot_1 = require("../bot");
function default_1(api) {
    api.get('/bot', function (req, res) {
        const controls = (0, bot_1.BotControl)();
        console.log('get bot');
        res.json({
            status: 'Start connect',
            controls
        });
    });
    api.post('/bot', function (req, res) {
        const controls = (0, bot_1.BotControl)(req.body);
        console.log('get bot');
        res.json({ controls });
    });
    // api.ws('/bot', (ws, req) => {
    //     console.log('ws bot api1');
    //     setInterval(function () {
    //         // body
    //         ws.send(JSON.stringify(['Privvet']));  
    //     }, 1000);
    // });
    api.ws('/bot', (ws, req) => {
        console.log('ws bot');
        const botEvHandler = function (msg) {
            const res = {
                status: 'On run',
                strategy: msg.strategy,
                positions: []
            };
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
    api.get('/candlesticks', (req, res) => {
        // Chart.candlesTicks(req.query, function (data: any) {
        //     res.json(data);
        // });
    });
    return api;
}
exports.default = default_1;
//# sourceMappingURL=api.js.map