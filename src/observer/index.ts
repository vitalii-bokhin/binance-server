import { TradesListStream } from '../binance_api';
import { CandlesTicksStream } from '../binance_api/CandlesTicksStream';
import Observer from './Observer';

const symbols: string[] = [
    'BTCUSDT' /*, 'MANAUSDT', 'GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT', 'FTMUSDT', 'MATICUSDT' */,
];
const interval: string = '1m';
const limit: number = 99; // candles ticks limit

// const { symbolsObj } = await getSymbols();

CandlesTicksStream({ symbols, interval, limit });
TradesListStream(symbols);

// ordersUpdateStream();

for (const symbol of symbols) {
    const observer = new Observer(symbol);
    observer.start();
}

console.log(`The script has been run. ${limit} candles with interval ${interval}.`);
