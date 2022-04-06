import ws from 'express-ws';
import { Bot, BotControl } from '../bot';

export default function (api: ws.Router) {
    api.get('/bot', function (req, res) {
        const controls = BotControl();

        console.log('get bot');

        res.json({
            status: 'Start connect',
            controls
        });
    });

    api.post('/bot', function (req, res) {
        const controls = BotControl(req.body);

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

        const botEvHandler = function (msg: { strategy: [], botPositions: { [x: string]: any; } }) {
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
        }

        Bot().then(ev => {
            ev.on('bot', botEvHandler);

            ws.on('close', () => {
                ev.off('bot', botEvHandler);
            });
        });
    });

    api.get('/candlesticks', (req: { query: any; }, res: { json: (arg0: any) => void; }) => {
        // Chart.candlesTicks(req.query, function (data: any) {
        //     res.json(data);
        // });
    });

    return api;
}