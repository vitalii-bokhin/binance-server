"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Strategy = void 0;
const aisle_1 = require("./aisle");
// export { Aisle, Fling };
const analizedSymbols = {};
let analizedSymbolsCount = 0;
const purpose = {
    scalping: [],
    scalpingMax: 5,
    aisle: [],
    aisleMax: 1
};
const tiSettings = {
    smaPeriod: 24,
    rsiPeriod: 9,
    atrPeriod: 14,
};
async function Strategy({ data, symbols }) {
    // if (analizedSymbolsCount < symbols.length) {
    //     console.log('-----analize symbols-----');
    //     console.log(symbols.length);
    //     for (const symbol in data) {
    //         if (Object.prototype.hasOwnProperty.call(data, symbol)) {
    //             if (!analizedSymbols[symbol]) {
    //                 const _candles = data[symbol];
    //                 const rsi = RSI({ data: _candles, period: tiSettings.rsiPeriod, symbol });
    //                 const avgRsiAbove = rsi.avgRsiAbove;
    //                 const avgRsiBelow = rsi.avgRsiBelow;
    //                 const sma = SMA({ data: _candles, period: tiSettings.smaPeriod });
    //                 const smaLag = sma.stack[sma.stack.length - tiSettings.smaPeriod / 2];
    //                 const smaChange = Math.abs((sma.last - smaLag) / (sma.last / 100));
    //                 const candles = [..._candles];
    //                 candles.pop();
    //                 let percentAverageCandleMove = 0;
    //                 candles.forEach(cdl => {
    //                     percentAverageCandleMove += (cdl.high - cdl.low) / (cdl.low / 100);
    //                 });
    //                 percentAverageCandleMove = percentAverageCandleMove / candles.length;
    //                 analizedSymbols[symbol] = {
    //                     symbol,
    //                     avgRsiAbove,
    //                     avgRsiBelow,
    //                     percentAverageCandleMove,
    //                     smaChange
    //                 };
    //                 analizedSymbolsCount++;
    //                 console.log(analizedSymbolsCount);
    //             }
    //         }
    //     }
    //     return [];
    // }
    // if (!purpose.scalping.length) {
    //     const symbArr = Object.keys(analizedSymbols).map(sym => analizedSymbols[sym]);
    //     symbArr.sort((a, b) => (b.smaChange / b.percentAverageCandleMove) - (a.smaChange / a.percentAverageCandleMove));
    //     purpose.scalping = symbArr.slice(0, purpose.scalpingMax).map(it => it.symbol);
    //     return [];
    // }
    // if (!purpose.aisle.length) {
    //     const symbArr = Object.keys(analizedSymbols).map(sym => analizedSymbols[sym]);
    //     symbArr.sort((a, b) => (b.smaChange / b.percentAverageCandleMove) - (a.smaChange / a.percentAverageCandleMove));
    //     purpose.aisle = symbArr.slice(0, purpose.aisleMax).map(it => it.symbol);
    //     return [];
    // }
    purpose.aisle = ['WAVESUSDT'];
    tiSettings.tdlLines = {
        ['WAVESUSDT']: {
            tdlTopLineOpt: [
                {
                    price: 26.9065,
                    time: { d: 8, h: 19, m: 20 }
                },
                {
                    price: 26.8579,
                    time: { d: 9, h: 3, m: 50 }
                }
            ],
            tdlbottomLineOpt: [
                {
                    price: 26.1405,
                    time: { d: 8, h: 19, m: 35 }
                },
                {
                    price: 26.5957,
                    time: { d: 9, h: 4, m: 0 }
                }
            ]
        }
    };
    const topLineOpt = [
        {
            price: 30.4315,
            time: { d: 8, h: 4, m: 30 }
        },
        {
            price: 29.4921,
            time: { d: 8, h: 10, m: 15 }
        },
    ];
    const bottomLineOpt = [
        {
            price: 29.9266,
            time: { d: 8, h: 2, m: 10 }
        },
        {
            price: 29.3618,
            time: { d: 8, h: 10, m: 20 }
        },
    ];
    const signals = [];
    for (const symbol in data) {
        if (Object.prototype.hasOwnProperty.call(data, symbol)) {
            const candlesData = data[symbol];
            // if (purpose.scalping.includes(symbol)) {
            //     signals.push(Scalping({ symbol, candlesData, tiSettings }));
            // }
            if (purpose.aisle.includes(symbol)) {
                signals.push((0, aisle_1.Aisle)({ symbol, candlesData, tiSettings }));
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
exports.Strategy = Strategy;
//# sourceMappingURL=index.js.map