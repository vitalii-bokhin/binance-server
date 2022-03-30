"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signals = exports.Fling = exports.Aisle = void 0;
const aisle_1 = require("./aisle");
Object.defineProperty(exports, "Aisle", { enumerable: true, get: function () { return aisle_1.Aisle; } });
const fling_1 = require("./fling");
Object.defineProperty(exports, "Fling", { enumerable: true, get: function () { return fling_1.Fling; } });
const scalping_1 = require("./scalping");
async function Signals({ fee, limit, data }) {
    let signals = [];
    try {
        // const aisle = await Aisle({ fee, limit, data });
        // const fling = await Fling({ fee, limit, data });
        const scalping = await (0, scalping_1.Scalping)({ fee, limit, data });
        signals = scalping;
        // const signals: Result = [].concat(aisle, fling);
        // signals.sort((a, b) => b.expectedProfit - a.expectedProfit);
        signals.sort((a, b) => a.possibleLoss - b.possibleLoss);
        // signals.sort((a, b) => b.preferIndex - a.preferIndex);
    }
    catch (error) {
        console.log(new Error(error));
    }
    return signals;
}
exports.Signals = Signals;
//# sourceMappingURL=index.js.map