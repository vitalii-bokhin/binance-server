import { candlesTicksStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Aisle, Fling } from './signals';

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
    const limit: number = 3;

    const { symbols, symbolsObj } = await getSymbols();

    candlesTicksStream({ symbols, interval, limit }, data => {
        if (!isPosition) {
            console.log(data);
        }

        Fling({ fee, limit, data }).then(res => {
            res.forEach(signal => {
                const pKey = signal.symbol;

                if (!botPositions[pKey] && !isPosition) {
                    isPosition = true;

                    botPositions[pKey] = new Position({
                        position: signal.position,
                        symbol: signal.symbol,
                        expectedProfit: signal.expectedProfit,
                        possibleLoss: signal.possibleLoss,
                        entryPrice: signal.entryPrice,
                        stopLoss: signal.stopLoss,
                        fee,
                        usdtAmount: 6,
                        symbolInfo: symbolsObj[signal.symbol]
                    });

                    console.log(botPositions);

                    botPositions[pKey].setEntryOrder()
                        .then((res) => {
                            console.log(res);
                        });
                }
            });
        });
    });
}