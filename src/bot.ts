import { candlesTicksStream, DepthStream, ordersUpdateStream, symbolCandlesTicksStream, tickerStream } from './binance_api/binanceApi';
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

const depthCache: {
    [symbol: string]: {
        maxAsk: {
            price: number;
            volume: number;
        };
        maxBid: {
            price: number;
            volume: number;
        };
    }
} = {};

export async function Bot(): Promise<events> {
    if (botIsRun) {
        console.log('Bot was run!');

    } else {

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

        DepthStream(['WAVESUSDT'], data => {
            console.log('RES');
            console.log('ask', data['WAVESUSDT'].asks/* .sort((a, b) => +a[0] - +b[0]) */.slice(0, 5));
            console.log('bid', data['WAVESUSDT'].bids/* .sort((a, b) => +b[0] - +a[0]) */.slice(0, 5));
            let highA: number = 0;
            let priceA: string;
            let high: number = 0;
            let price: string;

            data['WAVESUSDT'].asks.forEach(it => {
                if (+it[1] > highA) {
                    highA = +it[1];
                    priceA = it[0];
                }
            });

            data['WAVESUSDT'].bids.forEach(it => {
                if (+it[1] > high) {
                    high = +it[1];
                    price = it[0];
                }
            });

            depthCache['WAVESUSDT'] = {
                maxAsk: {
                    price:+priceA,
                    volume:highA
                },
                maxBid: {
                    price:+price,
                    volume:high
                }
            };
        });
    }

    return ev;
}

export function getDepthCache(symbol: string): {
    maxAsk: {
        price: number;
        volume: number;
    };
    maxBid: {
        price: number;
        volume: number;
    };
} {
    return depthCache[symbol];
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