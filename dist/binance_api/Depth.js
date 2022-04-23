"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Depth = void 0;
const _1 = require(".");
function Depth(symbols, callback) {
    const result = {};
    let i = 0;
    symbols.forEach(sym => {
        _1.binance.futuresDepth(sym, { limit: 100 }).then(data => {
            result[sym] = data;
            i++;
            if (i === symbols.length) {
                callback(result);
            }
        }).catch((error) => {
            console.log(new Error(error));
        });
    });
}
exports.Depth = Depth;
//# sourceMappingURL=Depth.js.map