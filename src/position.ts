import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';

// const binanceAuth = new Binance().options({
//     APIKEY: BINANCE_KEY,
//     APISECRET: BINANCE_SECRET,
//     useServerTime: true
// });
const binanceAuth = new Binance();

export class Position {
    position: 'long' | 'short';
    symbol: string;
    expectedProfit: number;
    possibleLoss: number;
    entryPrice: number;
    stopLoss: number;
    status: 'pending' | 'active' | 'closed';

    constructor(opt: {
        position: 'long' | 'short';
        symbol: string;
        expectedProfit: number;
        possibleLoss: number;
        entryPrice: number;
        stopLoss: number;
    }) {
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
    }

    setEntryOrder() {
        this.status = 'pending';

        const side = this.position === 'long' ? 'BUY' : 'SELL';

        binanceAuth.futuresOrder(side, this.symbol, this.entryPrice, );
    }
}