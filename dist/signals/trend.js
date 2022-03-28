"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Trend = void 0;
const analyzeCandle = function (cdl, pos) {
    if (cdl.close >= cdl.open) {
        // UP CANDLE
        const highTail = cdl.high - cdl.close;
        const body = cdl.close - cdl.open;
        const lowTail = cdl.open - cdl.low;
        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .3) {
            return 'stopLong';
        }
        else if (pos == 'short' && lowTail / (body + highTail) > .3) {
            return 'stopShort';
        }
    }
    else {
        // DOWN CANDLE
        const highTail = cdl.high - cdl.open;
        const body = cdl.open - cdl.close;
        const lowTail = cdl.close - cdl.low;
        if (body < lowTail && body < highTail) {
            return 'stopBoth';
        }
        else if (pos == 'short' && lowTail / (body + highTail) > .3) {
            return 'stopShort';
        }
        else if (pos == 'long' && highTail / (body + lowTail) > .3) {
            return 'stopLong';
        }
    }
};
function Trend({ fee, limit, data }) {
    return new Promise((resolve, reject) => {
        const result = [];
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                const _item = data[key];
                let item = [..._item];
                const lastCandle = item.pop();
                const volatility = {
                    avgChangeLong: 0,
                    avgChangeShort: 0
                };
                let sumChangeLongPerc = 0, sumChangeShortPerc = 0;
                item.forEach((cdl) => {
                    const changeLongPerc = (cdl.high - cdl.low) / (cdl.low / 100);
                    const changeShortPerc = (cdl.high - cdl.low) / (cdl.high / 100);
                    sumChangeLongPerc += changeLongPerc;
                    sumChangeShortPerc += changeShortPerc;
                });
                volatility.avgChangeLong = sumChangeLongPerc / item.length;
                volatility.avgChangeShort = sumChangeShortPerc / item.length;
            }
        }
        resolve(result);
    });
}
exports.Trend = Trend;
//# sourceMappingURL=trend.js.map