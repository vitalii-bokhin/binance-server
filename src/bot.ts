import { candlesTicksStream, ordersUpdateStream, symbolCandlesTicksStream, tickerStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';
import events from 'events';
import { SymbolResult } from './strategy/types';

const fee: number = .08,
    interval: string = '5m',
    limit: number = 72,
    leverage: number = 5;

const botPositions: {
    [key: string]: Position;
} = {};

const excludedPositions: string[] = [];

const ev = new events.EventEmitter();

let positions = 0;
let botIsRun = false;

const controls: {
    resolvePositionMaking: boolean;
} = {
    resolvePositionMaking: false
}

export async function Bot(): Promise<events> {
    if (botIsRun) {
        console.log('Bot was run!');
        return ev;
    }

    console.log(`Bot has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);

    botIsRun = true;

    ordersUpdateStream();
    tickerStream();

    const { symbols, symbolsObj } = await getSymbols();

    const _symbols = symbols;// ['ZILUSDT', 'WAVESUSDT', 'GMTUSDT'];

    const setPosition = function (s: SymbolResult): void {
        const pKey = s.symbol;

        if (excludedPositions.includes(pKey)) {
            return;
        }

        if (!botPositions[pKey] && positions < 2 && s.resolvePosition && s.percentLoss > fee) {
            positions++;

            let trailingStopTriggerPerc: number;
            let trailingStopPricePerc: number;
            let trailingStepPerc: number;

            // if (s.signal == 'scalping') {
            //     trailingStopTriggerPerc = .4;
            //     trailingStopPricePerc = .2;
            //     trailingStepPerc = .1;
            // }

            botPositions[pKey] = new Position({
                positionKey: pKey,
                position: s.position,
                symbol: s.symbol,
                expectedProfit: s.expectedProfit,
                entryPrice: s.entryPrice,
                takeProfit: s.takeProfit,
                percentLoss: s.percentLoss,
                fee,
                leverage,
                symbols: _symbols,
                symbolInfo: symbolsObj[s.symbol],
                trailingStopTriggerPerc,
                trailingStopPricePerc,
                trailingStepPerc,
                signal: s.signal,
                interval,
                limit,
                rsiPeriod: s.rsiPeriod,
                signalDetails: s.signalDetails
            });

            if (s.signal == 'scalping') {
                botPositions[pKey].setScalpingOrders();

            } else {
                // botPositions[pKey].setEntryOrder().then((res) => {
                //     console.log(res);

                //     if (res.error) {
                //         positions--;
                //     }
                // });
            }

            botPositions[pKey].deletePosition = function (positionKey, opt) {
                if (opt && opt.excludeKey) {
                    excludedPositions.push(opt.excludeKey);
                    console.log('EXCLUDED =' + positionKey);
                }

                delete botPositions[positionKey];
                positions--;

                console.log('DELETE =' + positionKey + '= POSITION OBJECT');
            }
        }
    }

    candlesTicksStream({ symbols: _symbols, interval, limit }, data => {
        Strategy({ data, symbols: _symbols }).then(res => {
            if (controls.resolvePositionMaking) {
                res.forEach(setPosition);
            }

            ev.emit('bot', { strategy: res, botPositions });
        });
    });

    return ev;
}

export function BotControl(req?: { [x: string]: any; }): typeof controls {
    if (req) {
        for (const key in req) {
            if (Object.prototype.hasOwnProperty.call(req, key)) {
                controls[key] = req[key];
            }
        }
    }

    return controls;
}