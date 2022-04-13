import WebSocket from 'ws';
import { binance, streamApi } from '.';

const wsStreams: {
    [key: string]: WebSocket;
} = {};

type TradesCallback = (arg0: {
    [symbol: string]: {
        price: string;
        qty: string;
        isBuyerMaker: boolean;
    }[];
}) => void;

type TradesStreamCallback = (arg0: {
    symbol: string;
    price: string;
    qty: string;
    isBuyerMaker: boolean;
}) => void;

let streamExecuted = false;
const streamSubscribers = [];

export function TradesList(symbols: string[], callback: TradesCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        binance.futuresTrades(sym, { limit: 1000 }).then(data => {
            result[sym] = data;

            i++;

            if (i === symbols.length) {
                callback(result);
            }
        }).catch((error: string) => {
            console.log(new Error(error));
        });
    });
}

export function TradesListStream(symbols: string[], callback: TradesStreamCallback): void {
    if (callback) {
        streamSubscribers.push(callback);
    }

    if (!streamExecuted) {
        const streams = symbols.map(s => s.toLowerCase() + '@aggTrade').join('/');

        streamExecuted = true;

        // TradesList(symbols, data => {
        // const result = {};
        let ws: WebSocket;

        if (wsStreams[streams] !== undefined) {
            ws = wsStreams[streams];
        } else {
            ws = new WebSocket(streamApi + streams);
            wsStreams[streams] = ws;
        }

        ws.on('message', function message(data: any) {
            const res: {
                s: string;
                p: string;
                q: string;
                m: boolean;
            } = JSON.parse(data).data;

            const { s: symbol, p: price, q: qty, m: isBuyerMaker } = res;

            streamSubscribers.forEach(cb => cb({ symbol, price, qty, isBuyerMaker }));
        });
        // });
    }
}