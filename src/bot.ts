import { candlesTicksStream } from './binanceApi';
import { Chart } from './chart';
import symbols = require('./data/symbols.json');
import { Position } from './position';
import { Volatility } from './signals/volatility';

const fee: number = .1;

Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
    Volatility({ fee, data });
});

const botPositions: {
    [key: string]: Position;
} = {};

export function Bot(): void {
    const interval: string = '1h';
    const limit: number = 2;

    candlesTicksStream({ symbols, interval, limit }, (data) => {
        Volatility({ fee, data })
            .then((res) => {
                res.forEach((signal) => {
                    const pKey = [signal.symbol, interval, limit].join('_');

                    if (!botPositions[pKey]) {
                        botPositions[pKey] = new Position({
                            position: signal.position,
                            symbol: signal.symbol,
                            expectedProfit: signal.expectedProfit,
                            possibleLoss: signal.possibleLoss,
                            entryPrice: signal.entryPrice,
                            stopLoss: signal.stopLoss,
                        });

                        botPositions[pKey].setEntryOrder();
                    }

                    console.log(signal);
                });
            });
    });
}