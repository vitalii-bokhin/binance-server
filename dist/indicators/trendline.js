"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDL = void 0;
const getPriceOnLine = function (line, time) {
    return ((time - line.start.time) / (line.start.time - line.end.time)) * (line.start.price - line.end.price) + line.start.price;
};
function TDL({ candles, trendsOpt }) {
    let signal, topPrice, bottomPrice, direction;
    const _candles = candles.slice(-3, -1);
    const lastCandle = candles.slice(-1)[0];
    for (const trend of trendsOpt) {
        signal = null;
        topPrice = null;
        bottomPrice = null;
        direction = null;
        const lines = [...trend.lines];
        if (lines[0].start.price > lines[1].start.price) {
            direction = 'up';
        }
        else {
            direction = 'down';
        }
        lines.sort((a, b) => b.start.price - a.start.price);
        const topLine = lines[0];
        const btmLine = lines[1];
        // const topLvl = getPriceOnLine(topLine, lastCandle.openTime);
        // const btmLvl = getPriceOnLine(btmLine, lastCandle.openTime);
        // if (
        //     lastCandle.high > btmLvl
        //     && lastCandle.low < topLvl
        // ) {
        //     signal = 'onTrend';
        // }
        for (const cdl of _candles) {
            const topLvl = getPriceOnLine(topLine, cdl.openTime);
            const btmLvl = getPriceOnLine(btmLine, cdl.openTime);
            if (cdl.high > btmLvl
                && cdl.low < topLvl) {
                signal = 'onTrend';
            }
        }
        if (signal) {
            topPrice = getPriceOnLine(topLine, lastCandle.openTime);
            bottomPrice = getPriceOnLine(btmLine, lastCandle.openTime);
            break;
        }
    }
    return { signal, topPrice, bottomPrice, direction };
}
exports.TDL = TDL;
//# sourceMappingURL=trendline.js.map