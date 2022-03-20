import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';

const binanceAuth = new Binance().options({
    APIKEY: BINANCE_KEY,
    APISECRET: BINANCE_SECRET,
    useServerTime: true
});
// const binanceAuth = new Binance();

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

    async setEntryOrder(symbolsObj: { [key: string]: { quantityPrecision: number; } }) {
        this.status = 'pending';

        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(6 / this.entryPrice).toFixed(symbolsObj[this.symbol].quantityPrecision);
        const entryParams = {
            timeInForce: 'GTC'
        };

        const lvr = await binanceAuth.futuresLeverage(this.symbol, 1);

        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);


        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: this.stopLoss
        };

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        return [entryOrd, stopOrd];
    }
}