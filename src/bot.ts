import { candlesTicksStream, ordersUpdateStream, tickerStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';

const fee: number = .08;

const botPositions: {
    [key: string]: Position;
} = {};

let positions = 0;

export async function Bot(): Promise<void> {
    ordersUpdateStream();
    tickerStream();

    const interval = '1m';
    const limit = 50;
    const leverage = 3;

    const { symbols, symbolsObj } = await getSymbols();

    const _symbols = ['1000XECUSDT']; //symbols; //['PEOPLEUSDT'];

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
                    entryPrice: s.entryPrice,
                    takeProfit: s.takeProfit,
                    percentLoss: s.percentLoss,
                    fee,
                    leverage,
                    symbols: _symbols,
                    symbolInfo: symbolsObj[s.symbol],
                    trailingStopTriggerPerc,
                    trailingStopPricePerc,
                    trailingStepPerc,
                    signal: s.signal,
                    interval,
                    limit,
                    rsiPeriod: s.rsiPeriod
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
                    console.log('DELETE POS');
                    console.log(positionKey);
                    console.log(botPositions[positionKey]);
                    delete botPositions[positionKey];
                    positions--;
                });

                console.log(botPositions);
            }
        });
    }

    candlesTicksStream({ symbols: _symbols, interval, limit }, data => {
        Strategy({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}