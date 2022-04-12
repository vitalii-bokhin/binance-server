import { OpenPosition } from './trade';
import Binance from 'node-binance-api';

const binance: Binance = new Binance().options({
    useServerTime: true
});


export async function ImmediatelyPosition({symbol, position, stopLoss, onePercLoss}: {symbol:string; position: 'long' | 'short'; stopLoss: number; onePercLoss: boolean;}): Promise<void> {
    
    const price = await binance.futuresMarkPrice(symbol);
    const lastPrice = +price.indexPrice;

    let percentLoss: number;

    if (position == 'long') {
        percentLoss = (lastPrice - stopLoss) / (lastPrice / 100);
    } else if (position == 'short') {
        percentLoss = (stopLoss - lastPrice) / (lastPrice / 100);
    }

    OpenPosition({
        entryPrice: lastPrice,
        position,
        strategy: 'manual',
        symbol,
        resolvePosition: true,
        percentLoss
    }, 'user');
}