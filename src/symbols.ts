import Binance from 'node-binance-api';

const binance = new Binance();

const symbolsObj: { [key: string]: { quantityPrecision: number; pricePrecision: number; minMarketLotSize: number; } } = {};
const symbols: string[] = [];

async function getSymbols(): Promise<{ symbols: string[]; symbolsObj: { [key: string]: { quantityPrecision: number; pricePrecision: number; minMarketLotSize: number; } }; }> {
    if (symbols.length) {
        return { symbols, symbolsObj };
    }

    const exchInfo = await binance.futuresExchangeInfo();

    exchInfo.symbols.forEach((sym: any) => {
        if (sym.contractType == 'PERPETUAL' && sym.status == 'TRADING' && sym.marginAsset == 'USDT') {
            let minMarketLotSize: number;

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

export default getSymbols;