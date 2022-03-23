"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signals = exports.Fling = exports.Aisle = void 0;
const aisle_1 = require("./aisle");
Object.defineProperty(exports, "Aisle", { enumerable: true, get: function () { return aisle_1.Aisle; } });
const fling_1 = require("./fling");
Object.defineProperty(exports, "Fling", { enumerable: true, get: function () { return fling_1.Fling; } });
async function Signals({ fee, limit, data }) {
    const aisle = await (0, aisle_1.Aisle)({ fee, limit, data });
    const fling = await (0, fling_1.Fling)({ fee, limit, data });
    const signals = [].concat(aisle, fling);
    signals.sort((a, b) => b.expectedProfit - a.expectedProfit);
    return signals;
}
exports.Signals = Signals;
//# sourceMappingURL=index.js.map