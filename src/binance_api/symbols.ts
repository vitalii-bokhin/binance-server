import { binance } from '.';

const symbolsObj: {
    [key: string]: {
        quantityPrecision: number;
        pricePrecision: number;
        minMarketLotSize: number;
        priceTickSize: number;
    }
} = {};

const symbols: string[] = [];

export default async function getSymbols(): Promise<{ symbols: string[]; symbolsObj: typeof symbolsObj; }> {
    if (symbols.length) {
        return { symbols, symbolsObj };
    }

    const exchInfo = await binance.futuresExchangeInfo();

    exchInfo.symbols.forEach((sym: any) => {
        if (sym.contractType == 'PERPETUAL' && sym.status == 'TRADING' && sym.marginAsset == 'USDT') {
            let minMarketLotSize: number;

            symbolsObj[sym.symbol] = {
                quantityPrecision: sym.quantityPrecision,
                pricePrecision: 0,
                minMarketLotSize,
                priceTickSize: null
            };

            for (const key in sym.filters) {
                if (Object.prototype.hasOwnProperty.call(sym.filters, key)) {
                    const item = sym.filters[key];

                    if (item.filterType == 'MARKET_LOT_SIZE') {
                        minMarketLotSize = +item.minQty;
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