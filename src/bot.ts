import { candlesTicksStream, ordersUpdateStream, symbolCandlesTicksStream, tickerStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';
import events from 'events';

const fee: number = .08;

const botPositions: {
    [key: string]: Position;
} = {};

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

    console.log('Bot has been run.');

    botIsRun = true;

    ordersUpdateStream();
    tickerStream();

    const interval = '5m';
    const limit = 100;
    const leverage = 3;

    const { symbols, symbolsObj } = await getSymbols();

    const _symbols = symbols; //['ZILUSDT', 'WAVESUSDT', 'GMTUSDT']; //symbols; //['PEOPLEUSDT'];

    const setPosition = function (s) {
        const pKey = s.symbol;

        if (!botPositions[pKey] && positions < 2 && s.resolvePosition) {
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
                botPositions[pKey].setScalpingOrders().then((res) => {
                    console.log({ error: '' });

                    if (res.error) {
                        console.log({ error: new Error(res.errorMsg) });
                    }
                });

            } else {
                // botPositions[pKey].setEntryOrder().then((res) => {
                //     console.log(res);

                //     if (res.error) {
                //         positions--;
                //     }
                // });
            }

            botPositions[pKey].deletePosition = function (positionKey) {
                console.log({ posMsg: 'DELETE POS', scalpOrder: '' });
                delete botPositions[positionKey];
                positions--;
            }
        }
    }

    candlesTicksStream({ symbols: _symbols, interval, limit }, data => {
        Strategy({ fee, limit, data }).then(res => {
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