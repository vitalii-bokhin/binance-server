"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const symbolsObj = {};
const symbols = [];
async function getSymbols() {
    if (symbols.length) {
        return { symbols, symbolsObj };
    }
    const exchInfo = await _1.binance.futuresExchangeInfo();
    exchInfo.symbols.forEach((sym) => {
        if (sym.contractType == 'PERPETUAL' && sym.status == 'TRADING' && sym.marginAsset == 'USDT') {
            symbolsObj[sym.symbol] = {
                quantityPrecision: sym.quantityPrecision,
                pricePrecision: 0,
                minMarketLotSize: null,
                priceTickSize: null,
                allData: sym
            };
            for (const key in sym.filters) {
                if (Object.prototype.hasOwnProperty.call(sym.filters, key)) {
                    const item = sym.filters[key];
                    if (item.filterType == 'MARKET_LOT_SIZE') {
                        symbolsObj[sym.symbol].minMarketLotSize = +item.minQty;
                    }
                    if (item.filterType == 'PRICE_FILTER') {
                        symbolsObj[sym.symbol].priceTickSize = +item.tickSize;
                    }
                }
            }
            if (String(symbolsObj[sym.symbol].priceTickSize).includes('.')) {
                symbolsObj[sym.symbol].pricePrecision = symbolsObj[sym.symbol].priceTickSize.toString().split('.')[1].length;
            }
            symbols.push(sym.symbol);
        }
    });
    return { symbols, symbolsObj };
}
exports.default = getSymbols;
//# sourceMappingURL=symbols.js.map