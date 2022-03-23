import { candlesTicksStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Signals } from './signals';

const fee: number = .1;

const botPositions: {
    [key: string]: Position;
} = {};

let isPosition = false;

export async function Bot(): Promise<void> {
    const interval: string = '1h';
    const limit: number = 3;

    const { symbols, symbolsObj } = await getSymbols();

    const setPosition = res => {
        res.sort((a, b) => b.expectedProfit - a.expectedProfit);

        res.forEach(s => {
            const pKey = s.symbol;

            if (!botPositions[pKey] && !isPosition) {
                isPosition = true;

                botPositions[pKey] = new Position({
                    position: s.position,
                    symbol: s.symbol,
                    expectedProfit: s.expectedProfit,
                    possibleLoss: s.possibleLoss,
                    entryPrice: s.entryPrice,
                    stopLoss: s.stopLoss,
                    fee,
                    usdtAmount: 6,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopLossStepPerc: s.expectedProfit < 1 ? s.expectedProfit : s.expectedProfit / 2,
                    signal: s.signal
                });

                console.log(botPositions);

                botPositions[pKey].setEntryOrder()
                    .then((res) => {
                        console.log(res);
                    });
            }
        });
    }

    candlesTicksStream({ symbols, interval, limit }, data => {
        Signals({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}