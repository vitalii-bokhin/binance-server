import { DepthStream } from "./binance_api/DepthStream";
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Strategy } from './strategy';
import events from 'events';
import { OpenPosition, _symbols } from './trade';
import { LevelOpt, TrendOpt } from './indicators/types';
import { GetData, SaveData, Tradelines } from './db/db';
import { TradesListStream } from './binance_api';

const ev = new events.EventEmitter();

let botIsRun = false;

export let controls: {
    resolvePositionMaking: boolean;
    tradingSymbols: string[];
} = {
    resolvePositionMaking: false,
    tradingSymbols: []
}

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

        await BotControl();

        await ManageTradeLines();

        CandlesTicksStream(null, data => {
            Strategy({
                data,
                symbols: _symbols,
                tradingSymbols: controls.tradingSymbols,
                tradeLines: tradeLinesCache
            }).then(res => {
                if (controls.resolvePositionMaking) {
                    res.forEach(singnal => OpenPosition(singnal, 'bot'));
                }

                // ev.emit('bot', { strategy: res });
            });
        });
    }

    return ev;
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
    removeAll: string;
}): Promise<void> {

    let tradeLines = await GetData<Tradelines>('tradelines');

    if (saveReq) {
        const { obj, removeId, removeAll } = saveReq;

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
        
        } else if (removeAll) {
            const survivors = [];

            for (const tLine of tradeLines) {
                if (removeAll !== tLine.symbol) {
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

let depthStreamHasBeenRun: boolean = false;

export const depthCache: {
    [symbol: string]: {
        maxAsk: {
            price: number;
            volume: number;
        };
        maxBid: {
            price: number;
            volume: number;
        };
        prevMaxAsk: {
            price: number;
            volume: number;
        };
        prevMaxBid: {
            price: number;
            volume: number;
        };
        asksSum: number;
        bidsSum: number;
        bestAsk: number;
        bestBid: number;
        prevBestAsk: number;
        prevBestBid: number;
    }
} = {};

export function runDepthStream(): void {
    if (depthStreamHasBeenRun) {
        return;
    }

    depthStreamHasBeenRun = true;

    DepthStream(_symbols, data => {
        for (const symbol in data) {
            if (Object.prototype.hasOwnProperty.call(data, symbol)) {
                const dataItem = data[symbol];

                const asksEstimatePrice = +dataItem.asks[0][0] + (5 * (+dataItem.asks[0][0] / 100));
                const bidsEstimatePrice = +dataItem.bids[0][0] - (5 * (+dataItem.bids[0][0] / 100));

                let highA: number = 0;
                let priceA: string;
                let highB: number = 0;
                let priceB: string;
                let prevHighA: number;
                let prevPriceA: number;
                let prevHighB: number;
                let prevPriceB: number;
                let asksSum: number = 0;
                let bidsSum: number = 0;
                let bestAsk: number;
                let bestBid: number;
                let prevBestAsk: number;
                let prevBestBid: number;

                bestAsk = +dataItem.asks[0][0];
                bestBid = +dataItem.bids[0][0];

                for (const ask of dataItem.asks) {
                    asksSum += +ask[1];

                    if (+ask[1] > highA) {
                        highA = +ask[1];
                        priceA = ask[0];
                    }

                    if (+ask[0] >= asksEstimatePrice) {
                        break;
                    }
                }

                for (const bid of dataItem.bids) {
                    bidsSum += +bid[1];

                    if (+bid[1] > highB) {
                        highB = +bid[1];
                        priceB = bid[0];
                    }

                    if (+bid[0] <= bidsEstimatePrice) {
                        break;
                    }
                }

                if (depthCache[symbol]) {
                    if (depthCache[symbol].maxAsk.price != +priceA) {
                        prevPriceA = depthCache[symbol].maxAsk.price;
                        prevHighA = depthCache[symbol].maxAsk.volume;
                    } else {
                        prevPriceA = depthCache[symbol].prevMaxAsk.price;
                        prevHighA = depthCache[symbol].prevMaxAsk.volume;
                    }

                    if (depthCache[symbol].maxBid.price != +priceB) {
                        prevPriceB = depthCache[symbol].maxBid.price;
                        prevHighB = depthCache[symbol].maxBid.volume;
                    } else {
                        prevPriceB = depthCache[symbol].prevMaxBid.price;
                        prevHighB = depthCache[symbol].prevMaxBid.volume;
                    }

                    if (depthCache[symbol].bestAsk != bestAsk) {
                        prevBestAsk = depthCache[symbol].bestAsk;
                    } else {
                        prevBestAsk = depthCache[symbol].prevBestAsk;
                    }

                    if (depthCache[symbol].bestBid != bestBid) {
                        prevBestBid = depthCache[symbol].bestBid;
                    } else {
                        prevBestBid = depthCache[symbol].prevBestBid;
                    }
                }

                depthCache[symbol] = {
                    maxAsk: {
                        price: +priceA,
                        volume: highA
                    },
                    maxBid: {
                        price: +priceB,
                        volume: highB
                    },
                    prevMaxAsk: {
                        price: prevPriceA,
                        volume: prevHighA
                    },
                    prevMaxBid: {
                        price: prevPriceB,
                        volume: prevHighB
                    },
                    asksSum,
                    bidsSum,
                    bestAsk,
                    bestBid,
                    prevBestAsk,
                    prevBestBid
                };

            }
        }
    });
}

let tradeListStreamHasBeenRun: boolean = false;

export const tradeListCache: {
    [symbol: string]: {
        buyVol: number;
        sellVol: number;
        prevBuyVol: number;
        prevSellVol: number;
        count: number;
    }
} = {};

export function runTradeListStream(): void {
    if (tradeListStreamHasBeenRun) {
        return;
    }

    tradeListStreamHasBeenRun = true;

    TradesListStream(_symbols, data => {

        if (!tradeListCache[data.symbol]) {
            tradeListCache[data.symbol] = {
                buyVol: !data.isBuyerMaker ? 0 : +data.qty,
                sellVol: data.isBuyerMaker ? +data.qty : 0,
                prevBuyVol: null,
                prevSellVol: null,
                count: 0
            };
        } else {
            tradeListCache[data.symbol].count++;

            if (data.isBuyerMaker) {
                tradeListCache[data.symbol].sellVol += +data.qty;
            } else {
                tradeListCache[data.symbol].buyVol += +data.qty;
            }

            if (tradeListCache[data.symbol].count >= 2) {
                tradeListCache[data.symbol].prevBuyVol = tradeListCache[data.symbol].buyVol;
                tradeListCache[data.symbol].prevSellVol = tradeListCache[data.symbol].sellVol;
                tradeListCache[data.symbol].buyVol = 0;
                tradeListCache[data.symbol].sellVol = 0;
                tradeListCache[data.symbol].count = 0;
            }
        }

    });
}