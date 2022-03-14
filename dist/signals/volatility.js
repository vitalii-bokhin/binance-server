"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Volatility = void 0;
const chart_1 = require("../chart");
var CdlDir;
(function (CdlDir) {
    CdlDir["up"] = "up";
    CdlDir["down"] = "down";
})(CdlDir || (CdlDir = {}));
const fee = .1;
// exported component
function Volatility() {
    const symbols = ['ADAUSDT', 'ATOMUSDT', 'BATUSDT', 'BCHUSDT', 'BNBUSDT', 'BTCUSDT', 'DASHUSDT', 'DOGEUSDT', 'EOSUSDT', 'ETCUSDT', 'ETHUSDT', 'IOSTUSDT', 'IOTAUSDT', 'LINKUSDT', 'LTCUSDT', 'MATICUSDT', 'NEOUSDT', 'ONTUSDT', 'QTUMUSDT', 'RVNUSDT', 'TRXUSDT', 'VETUSDT', 'XLMUSDT', 'XMRUSDT', 'XRPUSDT', 'ZECUSDT', 'XTZUSDT'];
    return new Promise((resolve, reject) => {
        chart_1.Chart.candlesticks({ symbols, interval: '2h', limit: 5 }, (data) => {
            const result = [];
            for (const key in data) {
                if (Object.prototype.hasOwnProperty.call(data, key)) {
                    const _item = data[key];
                    let firstCdlDir, expectedLastCdlDir, falseAccum = 0;
                    let item = [..._item];
                    const lastCandle = item.pop();
                    item.forEach((cdl, i) => {
                        if (!i) {
                            if (cdl.close >= cdl.open) {
                                firstCdlDir = CdlDir.up;
                                expectedLastCdlDir = CdlDir.up;
                            }
                            else {
                                firstCdlDir = CdlDir.down;
                                expectedLastCdlDir = CdlDir.down;
                            }
                        }
                        else {
                            if (firstCdlDir === CdlDir.up) {
                                if ((i % 2 === 0 && cdl.close < cdl.open) ||
                                    (i % 2 !== 0 && cdl.close >= cdl.open)) {
                                    falseAccum++;
                                }
                            }
                            if (firstCdlDir === CdlDir.down) {
                                if ((i % 2 !== 0 && cdl.close < cdl.open) ||
                                    (i % 2 === 0 && cdl.close >= cdl.open)) {
                                    falseAccum++;
                                }
                            }
                        }
                    });
                    if (!falseAccum) {
                        let keyResult = key + '- is volatile pair';
                        const volatility = {
                            minLong: 999,
                            minShort: 999
                        };
                        item.forEach((cdl, i) => {
                            if (cdl.close >= cdl.open) {
                                const changePerc = (cdl.high - cdl.low) / (cdl.low / 100);
                                if (changePerc < volatility.minLong) {
                                    volatility.minLong = changePerc;
                                }
                            }
                            else {
                                const changePerc = (cdl.high - cdl.low) / (cdl.high / 100);
                                if (changePerc < volatility.minShort) {
                                    volatility.minShort = changePerc;
                                }
                            }
                        });
                        if (expectedLastCdlDir === CdlDir.up) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                            if (changePerc < volatility.minLong - fee && lastCandle.close >= lastCandle.open) {
                                const expectedProfit = volatility.minLong - fee - changePerc;
                                const possibleLoss = ((lastCandle.close - lastCandle.low) / (lastCandle.close / 100)) + fee;
                                if (expectedProfit > possibleLoss) {
                                    keyResult += ' Long. Expected profit - ' + expectedProfit + ' Possible loss - ' + possibleLoss;
                                }
                            }
                        }
                        if (expectedLastCdlDir === CdlDir.down) {
                            const changePerc = (lastCandle.high - lastCandle.low) / (lastCandle.high / 100);
                            if (changePerc < volatility.minShort - fee && lastCandle.close < lastCandle.open) {
                                const expectedProfit = volatility.minShort - fee - changePerc;
                                const possibleLoss = ((lastCandle.high - lastCandle.close) / (lastCandle.close / 100)) + fee;
                                if (expectedProfit > possibleLoss) {
                                    keyResult += ' Short. Expected profit - ' + expectedProfit + ' Possible loss - ' + possibleLoss;
                                }
                            }
                        }
                        result.push({ key, desc: keyResult });
                    }
                }
            }
            resolve(result);
        });
    });
}
exports.Volatility = Volatility;
//# sourceMappingURL=volatility.js.map