"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const binance = new node_binance_api_1.default();
const symbolsObj = {};
const symbols = [];
async function getSymbols() {
    if (symbols.length) {
        return { symbols, symbolsObj };
    }
    const exchInfo = await binance.futuresExchangeInfo();
    exchInfo.symbols.forEach((sym) => {
        if (sym.contractType == 'PERPETUAL' && sym.status == 'TRADING' && sym.marginAsset == 'USDT') {
            let minMarketLotSize;
            for (const key in sym.filters) {
                if (Object.prototype.hasOwnProperty.call(sym.filters, key)) {
                    const item = sym.filters[key];
                    if (item.filterType == 'MARKET_LOT_SIZE') {
                        minMarketLotSize = +item.minQty;
                    }
                }
            }
            symbolsObj[sym.symbol] = {
                quantityPrecision: sym.quantityPrecision,
                pricePrecision: sym.pricePrecision,
                minMarketLotSize
            };
            symbols.push(sym.symbol);
        }
    });
    return { symbols, symbolsObj };
}
exports.default = getSymbols;
//# sourceMappingURL=symbols.js.map