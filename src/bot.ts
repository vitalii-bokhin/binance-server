import { candlesTicksStream, ordersUpdateStream, tickerStream } from './binanceApi';
import { Position } from './position';
import getSymbols from './symbols';
import { Strategy } from './strategy';
import { consoleLog } from './console';

const fee: number = .08;

const botPositions: {
    [key: string]: Position;
} = {};

let positions = 0;

export async function Bot(): Promise<void> {
    ordersUpdateStream();
    tickerStream();

    const interval = '5m';
    const limit = 50;
    const leverage = 3;

    const { symbols, symbolsObj } = await getSymbols();

    const _symbols = ['ZILUSDT', 'WAVESUSDT']; //symbols; //['PEOPLEUSDT'];

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
                    rsiPeriod: s.rsiPeriod,
                    signalDetails: s.signalDetails
                });

                if (s.signal == 'scalping') {
                    botPositions[pKey].setScalpingOrders().then((res) => {
                        consoleLog({error: ''});

                        if (res.error) {
                            consoleLog({error: new Error(res.errorMsg)});
                        }
                    });

                } else {
                    // botPositions[pKey].setEntryOrder().then((res) => {
                    //     console.log(res);

                    //     if (res.error) {
                    //         positions--;
                    //     }
                    // });
                }

                botPositions[pKey].deletePosition = function (positionKey) {
                    consoleLog({posMsg: 'DELETE POS', scalpOrder: ''});
                    delete botPositions[positionKey];
                    positions--;
                }

                consoleLog({botPositions});
            }
        });
    }

    candlesTicksStream({ symbols: _symbols, interval, limit }, data => {
        Strategy({ fee, limit, data }).then(res => {
            setPosition(res);
        });
    });
}