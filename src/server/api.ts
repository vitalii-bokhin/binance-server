import ws from 'express-ws';
import { CandlesTicks } from "../binance_api/CandlesTicks";
import { candlesTicksEvent } from '../binance_api/CandlesTicksStream';
import { Bot, BotControl, ManageTradeLines, tradeLinesCache } from '../bot';
import { ImmediatelyPosition } from '../manual';
import { ReuseStrategy } from '../strategy';
import getSymbols from '../binance_api/symbols';
import { _symbols } from '../trade';
import { openedPositions } from '../positions';
import { OpenedPosition } from '../positions/types';

export default function (api: ws.Router) {
    api.get('/bot', async (req, res) => {
        await Bot();

        const { resolvePositionMaking, tradingSymbols } = await BotControl();

        res.json({
            status: 'Start connect',
            availableSymbols: _symbols,
            resolvePositionMaking,
            tradingSymbols,
        });
    });

    api.post('/bot', async (req, res) => {
        if (req.body.reuseStrategy) {
            ReuseStrategy();

            res.json({ status: 'OK' });

        } else {
            await BotControl(req.body);

            res.json({ status: 'Controls' });
        }
    });

    api.ws('/bot', (ws, req) => {
        const botEvHandler = function (msg: { strategy: [], botPositions: { [x: string]: any; } }) {
            const res: {
                status: string;
                strategy: any;
                positions: any[];
            } = {
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
        }

        Bot().then(ev => {
            ev.on('bot', botEvHandler);

            ws.on('close', () => {
                ev.off('bot', botEvHandler);
            });
        });
    });

    api.get('/trade', (req, res) => {
        res.json({ symbols: _symbols });
    });

    api.post('/trade', (req, res) => {
        ImmediatelyPosition(req.body);
        res.json(req.body);
    });

    api.get('/candlesticks', (req, res) => {
        res.json([]);
        // Chart.candlesTicks(req.query, function (data: any) {
        //         res.json(data);
        // });
    });

    api.ws('/candlesticks', (ws, req: any) => {
        const symbol = req.query.symbol;

        candlesTicksEvent.on(symbol, data => {
            ws.send(JSON.stringify(data));
        });
    });

    api.get('/tradelines', async (req, res) => {
        await ManageTradeLines();
        res.json(tradeLinesCache);
    });

    api.post('/tradelines', async (req, res) => {
        await ManageTradeLines(req.body);
        res.json(tradeLinesCache);
    });

    api.get('/positions', async (req, res) => {
        const positions: OpenedPosition[] = [];

        openedPositions.forEach((item) => {
            positions.push({
                symbol: item.symbol,
                entryPrice: item.entryPrice,
                stopLoss: item.stopLoss,
                takeProfit: item.takeProfit,
            });
        });

        res.json(positions);
    });

    return api;
}