import { Candle, CdlDir, SymbolResult, SignalEntry, Result } from './types';

export function Scalping({ fee, limit, data }: SignalEntry) {
    return new Promise<Result>((resolve, reject) => {
        const result: Result = [];

        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const item = data[key];

                const prevCandle: Candle = item[item.length - 2];
                const lastCandle: Candle = item[item.length - 1];

                if (lastCandle.close >= lastCandle.open) {
                    // UP CANDLE
                    const highTail = lastCandle.high - lastCandle.close;
                    const body = lastCandle.close - lastCandle.open;
                    const lowTail = lastCandle.open - lastCandle.low;

                    if (highTail < lowTail && body > highTail) {
                        const stopLoss = lastCandle.low;
                        const possibleLoss = (lastCandle.close - stopLoss) / (lastCandle.close / 100) + fee;

                        const keyResult: SymbolResult = {
                            symbol: key,
                            position: 'long',
                            entryPrice: lastCandle.close,
                            possibleLoss,
                            stopLoss,
                            signal: 'scalping'
                        };

                        result.push(keyResult);
                    }

                } else {
                    // DOWN CANDLE
                    const highTail = lastCandle.high - lastCandle.open;
                    const body = lastCandle.open - lastCandle.close;
                    const lowTail = lastCandle.close - lastCandle.low;

                    if (lowTail < highTail && body > lowTail) {
                        const stopLoss = lastCandle.high;
                        const possibleLoss = (stopLoss - lastCandle.close) / (lastCandle.close / 100) + fee;

                        const keyResult: SymbolResult = {
                            symbol: key,
                            position: 'short',
                            entryPrice: lastCandle.close,
                            possibleLoss,
                            stopLoss,
                            signal: 'scalping'
                        };

                        result.push(keyResult);
                    }
                }

            }
        }

        resolve(result);
    });
}