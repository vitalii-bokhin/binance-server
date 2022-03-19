import Binance from 'node-binance-api';

const binance = new Binance();

const symbolsObj: { [key: string]: {quantityPrecision: number;} } = {};
const symbols: string[] = [];

async function getSymbols(): Promise<{ symbols: string[]; symbolsObj: { [key: string]: {quantityPrecision: number;} }; }> {
    if (symbols.length) {
        return { symbols, symbolsObj };
    }

    const exchInfo = await binance.futuresExchangeInfo();

    exchInfo.symbols.forEach((sym: any) => {
        if (sym.contractType == 'PERPETUAL' && sym.status == 'TRADING' && sym.marginAsset == 'USDT') {
            symbolsObj[sym.symbol] = {
                quantityPrecision: sym.quantityPrecision
            };

            symbols.push(sym.symbol);
        }
    });

    return { symbols, symbolsObj };
}

export default getSymbols;