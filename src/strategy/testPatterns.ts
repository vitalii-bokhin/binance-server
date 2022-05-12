import { Candle } from './types';
import { CandlesTicks } from '../binance_api/CandlesTicks';
import { SMA } from '../indicators';

const splitCdl = function (cdl: Candle): { highTail: number; body: number; lowTail: number; } {
    let highTail: number,
        body: number,
        lowTail: number;

    if (cdl.close > cdl.open) {
        highTail = cdl.high - cdl.close;
        body = cdl.close - cdl.open;
        lowTail = cdl.open - cdl.low;

    } else if (cdl.close < cdl.open) {
        highTail = cdl.high - cdl.open;
        body = cdl.open - cdl.close;
        lowTail = cdl.close - cdl.low;
    }

    return { highTail, body, lowTail };
}

const cache: {
    [symbol: string]: {
        patternsCount: number;
        profitCount: number;
        lossCount: number;
    };
} = {};

export function TestPatterns() {
    CandlesTicks({
        symbols: ['GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT'],
        interval: '5m',
        limit: 100
    }, data => {
        for (const symbol in data) {
            if (Object.prototype.hasOwnProperty.call(data, symbol)) {
                if (!cache[symbol]) {
                    cache[symbol] = {
                        patternsCount: 0,
                        profitCount: 0,
                        lossCount: 0
                    };
                }

                let POSITION = null;
                let STOP_LOSS = null;
                let TAKE_PROFIT = null;

                const candlesData = data[symbol];
                const _candles = [];

                candlesData.forEach((cdl, i) => {
                    _candles.push(cdl);

                    if (i > 2) {
                        const sma = SMA({ data: _candles, period: 69 }).last;

                        const cdl_3: Candle = _candles.slice(-4)[0];
                        const cdl_2: Candle = _candles.slice(-3)[0];
                        const cdl_1: Candle = _candles.slice(-2)[0];
                        const cdl_0: Candle = _candles.slice(-1)[0];

                        const long = function (stopLoss, entryPrice) {
                            if (!POSITION) {
                                cache[symbol].patternsCount++;

                                POSITION = 'long';
                                STOP_LOSS = stopLoss;
                                TAKE_PROFIT = entryPrice + (entryPrice - stopLoss);
                            }
                        }

                        const short = function (stopLoss, entryPrice) {
                            if (!POSITION) {
                                cache[symbol].patternsCount++;

                                POSITION = 'short';
                                STOP_LOSS = stopLoss;
                                TAKE_PROFIT = entryPrice - (stopLoss - entryPrice);
                            }
                        }

                        const cdl_2_Split = splitCdl(cdl_2);
                        const cdl_1_Split = splitCdl(cdl_1);

                        if ( // outside bar long
                            /* cdl_3.close < cdl_3.open
                            && */ cdl_2.close < cdl_2.open
                            && cdl_1.close > cdl_1.open
                            // && cdl_1.low < cdl_2.low
                            && cdl_1.close > cdl_2.high
                            && cdl_0.high > cdl_1.high
                        ) {
                            long(cdl_1.low, cdl_1.high);

                        } else if ( // outside bar short
                            /* cdl_3.close > cdl_3.open
                            && */ cdl_2.close > cdl_2.open
                            && cdl_1.close < cdl_1.open
                            // && cdl_1.high > cdl_2.high
                            && cdl_1.close < cdl_2.low
                            && cdl_0.low < cdl_1.low
                        ) {
                            short(cdl_1.high, cdl_1.low);
                        }

                        /* if ( // pinbar
                            cdl_2.close > cdl_2.open
                            && cdl_1.close > cdl_1.open
                            && cdl_1_Split.highTail > cdl_1_Split.lowTail * 2
                            && cdl_0.high > cdl_1.high
                        ) {
                            // if (cdl.high > sma) {
                                long(cdl_1.low, cdl_1.high);
                            // }

                        } else if (
                            cdl_2.close < cdl_2.open
                            && cdl_1.close < cdl_1.open
                            && cdl_1_Split.lowTail > cdl_1_Split.highTail * 2
                            && cdl_0.low < cdl_1.low
                        ) {
                            // if (cdl.low < sma) {
                                short(cdl_1.high, cdl_1.low);
                            // }
                        } */

                        // if (
                        //     cdl_2.close < cdl_2.open
                        //     && cdl_1_Split.lowTail > cdl_1_Split.body * 2
                        //     && cdl_1_Split.highTail < cdl_1_Split.body
                        //     && cdl_0.high > cdl_1.high
                        // ) {
                        //     if (cdl.high < sma) {
                        //         long(cdl_1.low, cdl_1.high);
                        //     }

                        // } else if (
                        //     cdl_2.close > cdl_2.open
                        //     && cdl_1_Split.highTail > cdl_1_Split.body * 2
                        //     && cdl_1_Split.lowTail < cdl_1_Split.body
                        //     && cdl_0.low < cdl_1.low
                        // ) {
                        //     if (cdl.high > sma) {
                        //         short(cdl_1.high, cdl_1.low);
                        //     }
                        // }

                        // if ( // inside bar
                        //     /* cdl_2_Split.highTail < cdl_2_Split.body
                        //     && cdl_2_Split.lowTail < cdl_2_Split.body
                        //     && cdl_1_Split.highTail < cdl_1_Split.body
                        //     && cdl_1_Split.lowTail < cdl_1_Split.body
                        //     && */ cdl_2.high > cdl_1.high
                        //     && cdl_2.low < cdl_1.low
                        // ) {
                        //     if ( // long
                        //         cdl.high > cdl_2.high
                        //     ) {
                        //         long(cdl_2.low, cdl_2.high);

                        //     } else if ( // short
                        //         cdl.low < cdl_2.low
                        //     ) {
                        //         short(cdl_2.high, cdl_2.low);
                        //     }
                        // }

                        if (POSITION == 'long') {
                            if (cdl_0.close < cdl_0.open) {
                                if (cdl_0.low <= STOP_LOSS) {
                                    cache[symbol].lossCount++;
                                    POSITION = null;
                                } else if (cdl_0.high >= TAKE_PROFIT) {
                                    cache[symbol].profitCount++;
                                    POSITION = null;
                                }
                            } else {
                                if (cdl_0.high >= TAKE_PROFIT) {
                                    cache[symbol].profitCount++;
                                    POSITION = null;
                                } else if (cdl_0.low <= STOP_LOSS) {
                                    cache[symbol].lossCount++;
                                    POSITION = null;
                                }
                            }

                        } else if (POSITION == 'short') {
                            if (cdl_0.close > cdl_0.open) {
                                if (cdl_0.high >= STOP_LOSS) {
                                    cache[symbol].lossCount++;
                                    POSITION = null;
                                } else if (cdl_0.low <= TAKE_PROFIT) {
                                    cache[symbol].profitCount++;
                                    POSITION = null;
                                }
                            } else {
                                if (cdl_0.low <= TAKE_PROFIT) {
                                    cache[symbol].profitCount++;
                                    POSITION = null;
                                } else if (cdl_0.high >= STOP_LOSS) {
                                    cache[symbol].lossCount++;
                                    POSITION = null;
                                }
                            }
                        }
                    }
                });
            }
        }

        console.log(cache);
    });
}