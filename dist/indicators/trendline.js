"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TDL = void 0;
const getTime = function ({ d, h, m }) {
    return new Date(2022, 3, d, h, m).getTime();
};
const getPriceOnLine = function (line, time) {
    return ((time - getTime(line.start.time)) / (getTime(line.start.time) - getTime(line.end.time))) * (line.start.price - line.end.price) + line.start.price;
};
const cache = {};
const getPrelSignal = function (cdl, lineOpt, prelSignal) {
    const priceOnLine = getPriceOnLine(lineOpt, cdl.openTime);
    const spread = lineOpt.spread;
    let signal;
    if (cdl.close > priceOnLine + spread) {
        signal = 'overLine';
    }
    else if (cdl.close < priceOnLine - spread) {
        signal = 'underLine';
    }
    else if (cdl.close < priceOnLine + spread && cdl.close < cdl.open) {
        signal = 'nextToTop';
    }
    else if (cdl.close > priceOnLine - spread && cdl.close > cdl.open) {
        signal = 'nextToBottom';
    }
    if (prelSignal == 'overLine') {
        if (cdl.close < priceOnLine - spread) {
            signal = 'crossBelow';
        }
        else if (cdl.close < priceOnLine + spread) {
            signal = 'nextToTop';
        }
    }
    else if (prelSignal == 'underLine') {
        if (cdl.close > priceOnLine + spread) {
            signal = 'crossAbove';
        }
        else if (cdl.close > priceOnLine - spread) {
            signal = 'nextToBottom';
        }
    }
    if (prelSignal == 'nextToTop') {
        if (cdl.close > priceOnLine + spread) {
            signal = 'bounceUp';
        }
        else if (cdl.close < priceOnLine - spread) {
            signal = 'crossBelow';
        }
        else {
            signal = 'nextToTop';
        }
    }
    else if (prelSignal == 'nextToBottom') {
        if (cdl.close < priceOnLine - spread) {
            signal = 'bounceDown';
        }
        else if (cdl.close > priceOnLine + spread) {
            signal = 'crossAbove';
        }
        else {
            signal = 'nextToBottom';
        }
    }
    if (prelSignal == 'crossAbove') {
        if (cdl.close < priceOnLine + spread) {
            signal = 'nextToBottom';
        }
    }
    else if (prelSignal == 'crossBelow') {
        if (cdl.close > priceOnLine - spread) {
            signal = 'nextToTop';
        }
    }
    if (prelSignal == 'bounceUp') {
        if (cdl.close < priceOnLine + spread) {
            signal = 'nextToTop';
        }
    }
    else if (prelSignal == 'bounceDown') {
        if (cdl.close > priceOnLine - spread) {
            signal = 'nextToBottom';
        }
    }
    return signal;
};
const getSignal = function (cdl, lineOpt, prelSignal) {
    const priceOnLine = getPriceOnLine(lineOpt, cdl.openTime);
    const spread = lineOpt.spread;
    let signal;
    if (prelSignal == 'bounceUp' && cdl.close > cdl.open) {
        signal = 'bounceUp';
    }
    else if (prelSignal == 'bounceDown' && cdl.close < cdl.open) {
        signal = 'bounceDown';
    }
    else if (prelSignal == 'crossAbove' && cdl.close > cdl.open) {
        signal = 'crossAbove';
    }
    else if (prelSignal == 'crossBelow' && cdl.close < cdl.open) {
        signal = 'crossBelow';
    }
    return signal;
};
function TDL({ symbol, candles, lineOpt }) {
    if (!cache[symbol]) {
        cache[symbol] = {
            prelSignal: null,
            openTime: null
        };
    }
    let signal;
    const _candles = candles.slice(-31);
    const curCdl = _candles.pop();
    const lastCdl = _candles.pop();
    if (curCdl.openTime !== cache[symbol].openTime) {
        _candles.forEach(cdl => {
            cache[symbol].prelSignal = getPrelSignal(cdl, lineOpt, cache[symbol].prelSignal);
            console.log(cache[symbol].prelSignal);
        });
        cache[symbol].openTime = curCdl.openTime;
    }
    const confirmSignal = getSignal(lastCdl, lineOpt, cache[symbol].prelSignal);
    console.log('confirm', confirmSignal);
    if ((confirmSignal == 'bounceUp' || confirmSignal == 'crossAbove') &&
        curCdl.close > curCdl.open) {
        signal = confirmSignal;
    }
    else if ((confirmSignal == 'bounceDown' || confirmSignal == 'crossBelow') &&
        curCdl.close < curCdl.open) {
        signal = confirmSignal;
    }
    return signal;
}
exports.TDL = TDL;
//# sourceMappingURL=trendline.js.map