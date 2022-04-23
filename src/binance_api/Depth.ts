import { binance } from '.';
import { DepthCallback } from './types';

export function Depth(symbols: string[], callback: DepthCallback): void {
    const result = {};

    let i = 0;

    symbols.forEach(sym => {
        binance.futuresDepth(sym, { limit: 100 }).then(data => {
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