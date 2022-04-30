import WebSocket from 'ws';
import { streamApi } from '.';
import { Depth } from './Depth';
import { DepthCallback } from './types';
import { wsStreams } from './binanceApi';

let depthStreamExecuted = false;
const depthStreamSubscribers = [];

export function DepthStream(symbols: string[], callback: DepthCallback): void {
    if (callback) {
        depthStreamSubscribers.push(callback);
    }

    if (!depthStreamExecuted) {
        depthStreamExecuted = true;

        const streams = symbols.map(s => s.toLowerCase() + '@depth@500ms').join('/');
        
        Depth(symbols, data => {
            let ws: WebSocket;
            let lastFinalUpdId: {
                [symbol: string]: number;
            } = {};

            const result: typeof data = Object.assign({}, data);

            if (wsStreams[streams] !== undefined) {
                ws = wsStreams[streams];
            } else {
                ws = new WebSocket(streamApi + streams);
                wsStreams[streams] = ws;
            }

            ws.on('message', function message(data: any) {
                const res: {
                    s: string;
                    u: number;
                    pu: number;
                    b: string[][];
                    a: string[][];
                } = JSON.parse(data).data;

                const { s: symbol, b: bids, a: asks, u: finalUpdId, pu: finalUpdIdInLast } = res;
                
                if (finalUpdId < result[symbol].lastUpdateId) {
                    console.log('finalUpdId < result[symbol].lastUpdateId', symbol);
                    return;
                }

                if (lastFinalUpdId[symbol] !== undefined && finalUpdIdInLast !== lastFinalUpdId[symbol]) {
                    console.log('finalUpdIdInLast !== lastFinalUpdId[symbol]', symbol);
                    return;
                } else {
                    lastFinalUpdId[symbol] = finalUpdId;
                }

                // Bids
                bids.reverse();

                const prelBids: string[][] = [];

                for (const curB of result[symbol].bids) {
                    let isset = false;

                    for (const newB of bids) {
                        if (newB[0] == curB[0]) {
                            if (+newB[1] !== 0) {
                                prelBids.push(newB);
                            }

                            isset = true;
                        }
                    }

                    if (!isset) {
                        prelBids.push(curB);
                    }
                }

                const resultBids: string[][] = [];

                for (let i = 0; i < prelBids.length; i++) {
                    const cBid = prelBids[i];

                    for (const newB of bids) {
                        if (newB[0] !== cBid[0] && +newB[1] !== 0) {
                            if (!i && +newB[0] > +cBid[0]) {
                                resultBids.push(newB);
                            } else if (i && +prelBids[i - 1][0] > +newB[0] && +newB[0] > +cBid[0]) {
                                resultBids.push(newB);
                            }
                        }
                    }

                    resultBids.push(cBid);

                    if (i == prelBids.length - 1) {
                        for (const newB of bids) {
                            if (newB[0] !== cBid[0] && +newB[1] !== 0 && +cBid[0] > +newB[0]) {
                                resultBids.push(newB);
                            }
                        }
                    }
                }

                // Asks
                const prelAsks: string[][] = [];

                for (const curA of result[symbol].asks) {
                    let isset = false;

                    for (const newA of asks) {
                        if (newA[0] == curA[0]) {
                            if (+newA[1] !== 0) {
                                prelAsks.push(newA);
                            }

                            isset = true;
                        }
                    }

                    if (!isset) {
                        prelAsks.push(curA);
                    }
                }

                const resultAsks: string[][] = [];

                for (let i = 0; i < prelAsks.length; i++) {
                    const cAsk = prelAsks[i];

                    for (const newA of asks) {
                        if (newA[0] !== cAsk[0] && +newA[1] !== 0) {
                            if (!i && +newA[0] < +cAsk[0]) {
                                resultAsks.push(newA);
                            } else if (i && +prelAsks[i - 1][0] < +newA[0] && +newA[0] < +cAsk[0]) {
                                resultAsks.push(newA);
                            }

                            if (i == prelAsks.length - 1 && +cAsk[0] < +newA[0]) {
                                resultAsks.push(newA);
                            }
                        }
                    }

                    resultAsks.push(cAsk);

                    if (i == prelAsks.length - 1) {
                        for (const newA of asks) {
                            if (newA[0] !== cAsk[0] && +newA[1] !== 0 && +cAsk[0] < +newA[0]) {
                                resultAsks.push(newA);
                            }
                        }
                    }

                }

                result[symbol].bids = resultBids;
                result[symbol].asks = resultAsks;

                depthStreamSubscribers.forEach(cb => cb(result));
            });
        });
    }
}
