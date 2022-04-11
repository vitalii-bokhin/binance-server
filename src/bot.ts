import { candlesTicksStream, ordersUpdateStream, symbolCandlesTicksStream, tickerStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';
import events from 'events';
import { SymbolResult } from './strategy/types';
import { OpenPosition } from './trade';

const ev = new events.EventEmitter();

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

    botIsRun = true;
    // tickerStream();

    const { symbols, symbolsObj } = await getSymbols();

    const _symbols = symbols; //['ZILUSDT', 'WAVESUSDT', 'GMTUSDT'];

    candlesTicksStream(null, data => {
        Strategy({ data, symbols: _symbols }).then(res => {
            if (controls.resolvePositionMaking) {
                res.forEach(sym => OpenPosition(sym, 'bot'));
            }

            ev.emit('bot', { strategy: res });
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