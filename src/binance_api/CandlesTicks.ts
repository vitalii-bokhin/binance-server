import { binance } from '.';
import { CandlesTicksCallback, CandlesTicksEntry } from './binanceApi';

export function CandlesTicks({ symbols, interval, limit }: CandlesTicksEntry, callback: CandlesTicksCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        const ticksArr = [];

        binance.futuresCandles(sym, interval, { limit }).then((ticks: any[]) => {
            ticks.forEach((tick: [any, any, any, any, any, any, any, any, any, any, any, any], i: string | number) => {
                const [openTime, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = tick;

                ticksArr[i] = {
                    openTime,
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

        }).catch((error: string) => {
            console.log(new Error(error));
        });
    });
}
