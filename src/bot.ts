import symbols from './data/symbols.json';
import { candlesTicksStream } from './binanceApi';
import { Chart } from './chart';
import { Position } from './position';
import { Volatility } from './signals/volatility';
import getSymbols from './symbols';

const fee: number = .1;

// Chart.candlesTicks({ symbols, interval: '1h', limit: 5 }, (data) => {
//     Volatility({ fee, data });
// });

const botPositions: {
    [key: string]: Position;
} = {};

let isPosition = false;

export async function Bot(): Promise<void> {
    const interval: string = '1h';
    const limit: number = 5;

    const { symbols, symbolsObj } = await getSymbols();

    candlesTicksStream({ symbols, interval, limit }, (data) => {
        Volatility({ fee, limit, data }).then((res) => {
            res.forEach((signal) => {
                const pKey = [signal.symbol, interval, limit].join('_');

                if (!botPositions[pKey] && !isPosition) {
                    isPosition = true;

                    botPositions[pKey] = new Position({
                        position: signal.position,
                        symbol: signal.symbol,
                        expectedProfit: signal.expectedProfit,
                        possibleLoss: signal.possibleLoss,
                        entryPrice: signal.entryPrice,
                        stopLoss: signal.stopLoss,
                    });

                    console.log(botPositions[pKey]);

                    botPositions[pKey].setEntryOrder(symbolsObj)
                        .then((so) => {
                            console.log(so);
                        });
                }
            });
        });
    });
}