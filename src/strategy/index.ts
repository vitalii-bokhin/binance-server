import { Result, Entry, Candle } from './types';
// import { Aisle } from './aisle';
// import { Fling } from './fling';
import { Scalping } from './scalping';
import { RSI, SMA } from '../indicators';

// export { Aisle, Fling };

const analizedSymbols: {
    [symbol: string]: {
        symbol: string;
        avgRsiAbove: number;
        avgRsiBelow: number;
        percentAverageCandleMove: number;
        smaChange: number;
    }
} = {};

let analizedSymbolsCount = 0;

const purpose: {
    scalping: string[];
    scalpingMax: number;
} = {
    scalping: [],
    scalpingMax: 5
};

const tiSettings = {
    smaPeriod: 24,
    rsiPeriod: 9,
    atrPeriod: 14,
};

export async function Strategy({ data, symbols }: { data: { [sym: string]: Candle[] }; symbols: string[] }): Promise<Result> {

    if (analizedSymbolsCount < symbols.length) {
        console.log('-----analize symbols-----');
        console.log(symbols.length);

        for (const symbol in data) {
            if (Object.prototype.hasOwnProperty.call(data, symbol)) {
                if (!analizedSymbols[symbol]) {
                    const _candles = data[symbol];
                    const rsi = RSI({ data: _candles, period: tiSettings.rsiPeriod, symbol });
                    const avgRsiAbove = rsi.avgRsiAbove;
                    const avgRsiBelow = rsi.avgRsiBelow;

                    const sma = SMA({ data: _candles, period: tiSettings.smaPeriod });
                    const smaLag = sma.stack[sma.stack.length - tiSettings.smaPeriod / 2];
                    const smaChange = Math.abs((sma.last - smaLag) / (sma.last / 100));

                    const candles = [..._candles];

                    candles.pop();

                    let percentAverageCandleMove = 0;

                    candles.forEach(cdl => {
                        percentAverageCandleMove += (cdl.high - cdl.low) / (cdl.low / 100);
                    });

                    percentAverageCandleMove = percentAverageCandleMove / candles.length;

                    analizedSymbols[symbol] = {
                        symbol,
                        avgRsiAbove,
                        avgRsiBelow,
                        percentAverageCandleMove,
                        smaChange
                    };

                    analizedSymbolsCount++;

                    console.log(analizedSymbolsCount);
                }
            }
        }

        return [];
    }

    if (!purpose.scalping.length) {
        const symbArr = Object.keys(analizedSymbols).map(sym => analizedSymbols[sym]);

        symbArr.sort((a, b) => (b.smaChange / b.percentAverageCandleMove) - (a.smaChange / a.percentAverageCandleMove));

        purpose.scalping = symbArr.slice(0, purpose.scalpingMax).map(it => it.symbol);

        return [];
    }

    const signals: Result = [];

    for (const symbol in data) {
        if (Object.prototype.hasOwnProperty.call(data, symbol)) {
            const candlesData = data[symbol];

            if (purpose.scalping.includes(symbol)) {
                signals.push(Scalping({ symbol, candlesData, tiSettings }));
            }


            // try {
            // const aisle = await Aisle({ fee, limit, data });
            // const fling = await Fling({ fee, limit, data });

            // const scalping = await Scalping({ fee, limit, data, tiSettings });

            // signals = scalping;
            // const signals: Result = [].concat(aisle, fling);

            // signals.sort((a, b) => b.expectedProfit - a.expectedProfit);
            // signals.sort((a, b) => a.possibleLoss - b.possibleLoss);
            // signals.sort((a, b) => b.preferIndex - a.preferIndex);

            // } catch (error) {
            //     console.log(new Error(error));
            // }

            // signals = [];

        }
    }

    signals.sort((a, b) => b.preferIndex - a.preferIndex);

    return signals;
}