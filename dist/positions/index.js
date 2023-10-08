"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openPosition = exports.openedPositions = void 0;
const wss_1 = require("../server/wss");
const PositionEmulation_1 = __importDefault(require("./PositionEmulation"));
exports.openedPositions = new Map();
function openPosition(props) {
    if (exports.openedPositions.has(props.symbol))
        return;
    exports.openedPositions.set(props.symbol, new PositionEmulation_1.default(props));
    exports.openedPositions.get(props.symbol)
        .open()
        .then((symbol) => {
        exports.openedPositions.delete(symbol);
        console.log('Close position - ' + symbol);
        wss_1.wsEvent.emit('send');
    });
}
exports.openPosition = openPosition;
//# sourceMappingURL=index.js.map