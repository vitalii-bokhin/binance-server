import WebSocket from 'ws';
import Binance from 'node-binance-api';

const binance = new Binance();

const streamApi = 'wss://fstream.binance.com/stream?streams=';

type Candle = {
    openTime: number;
    high: number;
    open: number;
    close: number;
    low: number;
    interval: string;
    limit: number;
    isFinal?: boolean;
};

type CandlesTicksEntry = {
    symbols: string[];
    interval: string;
    limit: number;
};

type CandlesTicksCallback = (arg0: { [key: string]: Candle[] }) => void;

const streamsSubscribers: {
    [key: string]: WebSocket;
} = {};

export function candlesTicks({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        const ticksArr = [];

        binance.futuresCandles(sym, interval, { limit }).then(ticks => {
            ticks.forEach((tick, i) => {
                let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;

                ticksArr[i] = {
                    openTime: time,
                    open: +open,
                    high: +high,
                    low: +low,
                    close: +close
                };
            });

            result[sym] = ticksArr;

            i++;

            if (i === symbols.length) {
                callback(result);
            }
        });
    });
}

export function candlesTicksStream({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    candlesTicks({ symbols, interval, limit }, (data) => {
        const result = data;
        const streams = symbols.map(s => s.toLowerCase() + '@kline_' + interval).join('/');

        let ws: WebSocket;

        if (streamsSubscribers[streams] !== undefined) {
            ws = streamsSubscribers[streams];
        } else {
            ws = new WebSocket(streamApi + streams);
            streamsSubscribers[streams] = ws;
        }

        ws.on('message', function message(data: any) {
            const { e: eventType, E: eventTime, s: symbol, k: ticks } = JSON.parse(data).data;
            const { t: openTime, o: open, h: high, l: low, c: close, x: isFinal } = ticks;

            const candle: Candle = {
                openTime: openTime,
                open: +open,
                high: +high,
                low: +low,
                close: +close,
                interval,
                limit
            };

            if (result[symbol][result[symbol].length - 1].openTime !== openTime) {
                result[symbol].push(candle);
            }

            result[symbol][result[symbol].length - 1] = candle;

            callback(result);

            if (isFinal) {
                result[symbol].shift();
            }
        });
    });
}

export function ordersUpdateStream({symbol}) {

}