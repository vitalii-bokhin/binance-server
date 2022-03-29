import { candlesTicksStream, ordersUpdateStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Signals } from './signals';

const fee: number = .1;

const botPositions: {
    [key: string]: Position;
} = {};

let positions = 0;

export async function Bot(): Promise<void> {
    ordersUpdateStream();

    const interval = '1h';
    const limit = 5;
    const usdtAmount = 10;
    const leverage = 2;

    const { symbols, symbolsObj } = await getSymbols();

    const setPosition = res => {
        res.forEach(s => {
            const pKey = s.symbol;

            if (!botPositions[pKey] && positions < 1) {
                positions++;

                let trailingStopTriggerPerc: number;
                let trailingStopPricePerc: number;
                let trailingStepPerc: number;

                // if (s.signal == 'scalping') {
                //     trailingStopTriggerPerc = .4;
                //     trailingStopPricePerc = .2;
                //     trailingStepPerc = .1;
                // }

                botPositions[pKey] = new Position({
                    positionKey: pKey,
                    position: s.position,
                    symbol: s.symbol,
                    expectedProfit: s.expectedProfit,
                    possibleLoss: s.possibleLoss,
                    entryPrice: s.entryPrice,
                    takeProfit: s.takeProfit,
                    stopLoss: s.stopLoss,
                    fee,
                    usdtAmount,
                    leverage,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopTriggerPerc,
                    trailingStopPricePerc,
                    trailingStepPerc,
                    signal: s.signal
                });

                if (s.signal == 'scalping') {
                    botPositions[pKey].setScalpingOrders().then((res) => {
                        console.log(res);

                        if (res.error) {
                            positions--;
                        }
                    });

                } else {
                    botPositions[pKey].setEntryOrder().then((res) => {
                        console.log(res);

                        if (res.error) {
                            positions--;
                        }
                    });
                }

                botPositions[pKey].deletePosition(positionKey => {
                    delete botPositions[positionKey];
                    positions--;
                });

                console.log(botPositions);
            }
        });
    }

    candlesTicksStream({ symbols, interval, limit }, data => {
        Signals({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}