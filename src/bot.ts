import { candlesTicksStream } from './binanceApi';
import { Chart } from './chart';
import symbols = require('./data/symbols.json');
import { Volatility } from './signals/volatility';

const fee: number = .1;


Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
    Volatility({fee, data});
});

export function Bot() {
    candlesTicksStream({ symbols: ['BTCUSDT'], interval: '1m', limit: 2 }, (data) => {
        const s = Volatility({fee, data});
        console.log(s);
    });
}