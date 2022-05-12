import WebSocket from 'ws';
import { streamApi } from '.';
import { CandlesTicks } from './CandlesTicks';
import { wsStreams } from './binanceApi';
import { Candle, CandlesTicksCallback, CandlesTicksEntry, SymbolCandlesTicksCallback } from './types';

let candlesTicksStreamExecuted = false;

const candlesTicksStreamSubscribers: ((arg0: any) => void)[] = [];
const testCandlesTicksStreamSubscribers: ((arg0: any) => void)[] = [];

export function CandlesTicksStream(opt: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    if (callback) {
        candlesTicksStreamSubscribers.push(callback);
    }

    if (!candlesTicksStreamExecuted && opt) {
        const { symbols, interval, limit } = opt;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');

        candlesTicksStreamExecuted = true;

        CandlesTicks({ symbols, interval, limit }, data => {
            const result = data;
            let ws: WebSocket;

            if (wsStreams[streams] !== undefined) {
                ws = wsStreams[streams];
            } else {
                ws = new WebSocket(streamApi + streams);
                wsStreams[streams] = ws;
            }

            ws.on('message', function message(wsMsg: any) {
                const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(wsMsg).data;
                const { t: openTime, o: open, h: high, l: low, c: close, v: volume, V: buyVolume } = ticks;

                const candle: Candle = {
                    openTime: openTime,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close,
                    volume: +volume
                };

                if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                    result[symbol].push(candle);
                    result[symbol].shift();
                } else {
                    result[symbol][result[symbol].length - 1] = candle;
                }

                candlesTicksStreamSubscribers.forEach(cb => cb(result));

                if (symbolCandlesTicksStreamSubscribers[symbol]) {
                    symbolCandlesTicksStreamSubscribers[symbol].forEach(cb => cb(result[symbol]));
                }
            });
        });
    }
}

const symbolCandlesTicksStreamSubscribers: {
    [key: string]: ((arg0: any) => void)[];
} = {};

export function symbolCandlesTicksStream(symbol: string, callback: SymbolCandlesTicksCallback, clearSymbolCallback?: boolean) {
    if (symbol && callback) {
        if (!symbolCandlesTicksStreamSubscribers[symbol]) {
            symbolCandlesTicksStreamSubscribers[symbol] = [];
        }

        symbolCandlesTicksStreamSubscribers[symbol].push(callback);
    }

    if (clearSymbolCallback && symbolCandlesTicksStreamSubscribers[symbol]) {
        delete symbolCandlesTicksStreamSubscribers[symbol];
    }
}