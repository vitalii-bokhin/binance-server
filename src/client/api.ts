import ws from 'express-ws';
import { Bot, BotControl } from '../bot';
import { ImmediatelyPosition } from '../manual';
import getSymbols from '../symbols';

export default function (api: ws.Router) {
    api.get('/bot', function (req, res) {
        const controls = BotControl();

        res.json({
            status: 'Start connect',
            controls
        });
    });

    api.post('/bot', function (req, res) {
        const controls = BotControl(req.body);

        res.json({ controls });
    });

    api.ws('/bot', (ws, req) => {
        const botEvHandler = function (msg: { strategy: [], botPositions: { [x: string]: any; } }) {
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
        }

        Bot().then(ev => {
            ev.on('bot', botEvHandler);

            ws.on('close', () => {
                ev.off('bot', botEvHandler);
            });
        });
    });

    api.get('/trade', function (req, res) {
        getSymbols().then(({ symbols, symbolsObj }) => {
            res.json({ symbols });
        });

    });

    api.post('/trade', function (req, res) {
        ImmediatelyPosition(req.body);
        res.json(req.body);
    });

    /* api.get('/candlesticks', (req: { query: any; }, res: { json: (arg0: any) => void; }) => {
        // Chart.candlesTicks(req.query, function (data: any) {
            //     res.json(data);
        // });
    }); */

    return api;
}