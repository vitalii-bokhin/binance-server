import { DepthStream, ordersUpdateStream, tickerStream } from './binance_api/binanceApi';
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';
import events from 'events';
import { SymbolResult } from './strategy/types';
import { OpenPosition } from './trade';
import { LevelOpt, TrendOpt } from './indicators/types';
import { GetData, SaveData, Tradelines } from './db/db';

const ev = new events.EventEmitter();

let botIsRun = false;

export let controls: {
    resolvePositionMaking: boolean;
    tradingSymbols: string[];
} = {
    resolvePositionMaking: false,
    tradingSymbols: []
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

export let tradeLinesCache: {
    [symbol: string]: {
        levels?: LevelOpt[];
        trends?: TrendOpt[];
    };
} = {};

export async function Bot(): Promise<events> {
    if (botIsRun) {
        console.log('Bot was run!');

    } else {
        console.log('Bot has been run!');

        botIsRun = true;
        // tickerStream();

        const { symbols, symbolsObj } = await getSymbols();

        await BotControl();

        await ManageTradeLines();

        const _symbols = symbols;

        CandlesTicksStream(null, data => {
            Strategy({
                data,
                symbols: _symbols,
                tradingSymbols: controls.tradingSymbols,
                tradeLines: tradeLinesCache
            }).then(res => {
                if (controls.resolvePositionMaking) {
                    res.forEach(sym => OpenPosition(sym, 'bot'));
                }

                ev.emit('bot', { strategy: res });
            });
        });

        DepthStream(['ZILUSDT'], data => {
            console.log('RES');
            console.log('ask', data['ZILUSDT'].asks/* .sort((a, b) => +a[0] - +b[0]) */.slice(0, 5));
            console.log('bid', data['ZILUSDT'].bids/* .sort((a, b) => +b[0] - +a[0]) */.slice(0, 5));

            const asksSum = data['ZILUSDT'].asks.reduce((p, c) => p + +c[1], 0);
            const bidsSum = data['ZILUSDT'].bids.reduce((p, c) => p + +c[1], 0);

            let highA: number = 0;
            let priceA: string;
            let high: number = 0;
            let price: string;

            data['ZILUSDT'].asks.forEach(it => {
                if (+it[1] > highA) {
                    highA = +it[1];
                    priceA = it[0];
                }
            });

            data['ZILUSDT'].bids.forEach(it => {
                if (+it[1] > high) {
                    high = +it[1];
                    price = it[0];
                }
            });

            depthCache['ZILUSDT'] = {
                maxAsk: {
                    price: +priceA,
                    volume: highA
                },
                maxBid: {
                    price: +price,
                    volume: high
                }
            };

            console.log(depthCache['ZILUSDT']);
            console.log(asksSum > bidsSum ? 'ask' : 'bid');
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

export async function BotControl(req?: { [x: string]: any; }): Promise<{ resolvePositionMaking: boolean; tradingSymbols: string[]; }> {
    let botControls = await GetData<typeof controls>('botcontrols');

    if (!botControls) {
        botControls = controls;
    }

    if (req) {
        for (const key in req) {
            if (Object.prototype.hasOwnProperty.call(req, key)) {
                botControls[key] = req[key];
            }
        }

        await SaveData('botcontrols', botControls);
    }

    controls = botControls;

    return botControls;
}

export async function ManageTradeLines(saveReq?: {
    obj?: {
        id: string;
        type: 'trends' | 'levels';
        symbol: string;
        price?: [];
        lines?: [];
    };
    removeId: string;
}): Promise<void> {

    let tradeLines = await GetData<Tradelines>('tradelines');

    if (saveReq) {
        const { obj, removeId } = saveReq;

        if (obj) {
            if (!obj.symbol) {
                return;
            }

            if (tradeLines && tradeLines.length) {
                let isNew = true;

                for (const tLine of tradeLines) {
                    if (obj.id == tLine.id) {
                        isNew = false;

                        if (obj.type == 'levels') {
                            tLine.price = obj.price;
                        } else if (obj.type == 'trends') {
                            tLine.lines = obj.lines;
                        }
                    }
                }

                if (isNew) {
                    if (obj.type == 'levels') {
                        tradeLines.push({
                            id: obj.id,
                            symbol: obj.symbol,
                            type: obj.type,
                            price: obj.price
                        });
                    } else if (obj.type == 'trends') {
                        tradeLines.push({
                            id: obj.id,
                            symbol: obj.symbol,
                            type: obj.type,
                            lines: obj.lines
                        });
                    }
                }

            } else {
                tradeLines = [];

                if (obj.type == 'levels') {
                    tradeLines.push({
                        id: obj.id,
                        symbol: obj.symbol,
                        type: obj.type,
                        price: obj.price
                    });
                } else if (obj.type == 'trends') {
                    tradeLines.push({
                        id: obj.id,
                        symbol: obj.symbol,
                        type: obj.type,
                        lines: obj.lines
                    });
                }
            }

        } else if (removeId) {
            const survivors = [];

            for (const tLine of tradeLines) {
                if (removeId !== tLine.id) {
                    survivors.push(tLine);
                }
            }

            tradeLines = survivors;
        }

        await SaveData('tradelines', tradeLines);
    }

    // get to cache
    tradeLinesCache = {};

    if (tradeLines && tradeLines.length) {
        for (const tLine of tradeLines) {
            if (!tradeLinesCache[tLine.symbol]) {
                tradeLinesCache[tLine.symbol] = {
                    levels: [],
                    trends: []
                };
            }

            if (tLine.type == 'levels') {
                tradeLinesCache[tLine.symbol].levels.push({
                    price: tLine.price,
                    id: tLine.id
                });

            } else if (tLine.type == 'trends') {
                tradeLinesCache[tLine.symbol].trends.push({
                    lines: tLine.lines,
                    id: tLine.id
                });
            }
        }
    }
}