import { ordersUpdateStream } from './binance_api/binanceApi';
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Position } from './position';
import { SymbolResult } from './strategy/types';
import getSymbols from './binance_api/symbols';

const fee: number = .08,
    interval: string = '5m',
    limit: number = 100,
    leverage: number = 20,
    maxBotPositions: number = 2;

export const openedPositions: {
    [key: string]: Position;
} = {};

let excludedPositions: string[] = [];
let botPositions = 0;

export let _symbols: string[];

let _symbolsObj: { [key: string]: any };

(async function () {
    const { symbols, symbolsObj } = await getSymbols();

    _symbols = ['GMTUSDT', 'FTMUSDT', 'ZILUSDT']; //symbols, ,'LUNAUSDT', 'WAVESUSDT', 'MATICUSDT';
    _symbolsObj = symbolsObj;

    CandlesTicksStream({ symbols: _symbols, interval, limit }, null);

    ordersUpdateStream();

    console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
})();

export function OpenPosition(s: SymbolResult, initiator: 'bot' | 'user') {
    const pKey = s.symbol;

    // console.log('******************************************************');
    // console.log('s.symbol', s.symbol);
    // console.log('open positions', Object.keys(openedPositions));
    // console.log('s.resolvePosition', s.resolvePosition);
    // console.log('excludedPositions', excludedPositions);
    // console.log('initiator', initiator);
    // console.log('botPositions', botPositions);
    // console.log('s.percentLoss', s.percentLoss);
    // console.log('******************************************************');

    if (
        openedPositions[pKey]
        || !s.resolvePosition
        || excludedPositions.includes(pKey)
        || (initiator == 'bot' && botPositions >= maxBotPositions)
        || s.percentLoss < fee
    ) {
        return;
    }

    if (initiator == 'bot') {
        botPositions++;
    }

    let trailingStopStartTriggerPricePerc: number;
    let trailingStopStartOrderPerc: number;
    let trailingStopTriggerPriceStepPerc: number;
    let trailingStopOrderDistancePerc: number;
    let takeProfitPerc: number;
    let setTakeProfit: boolean;
    let useTrailingStop: boolean;

    const atrPerc = s.atr / (s.entryPrice / 100);

    if (s.strategy == 'follow_candle') {
        setTakeProfit = true;
        // takeProfitPerc = atrPerc / 5;
        takeProfitPerc = s.percentLoss / 10;
    }

    if (s.strategy == 'traders_force') {
        setTakeProfit = true;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = s.percentLoss / 2;
        trailingStopStartOrderPerc = fee;
        // takeProfitPerc = s.percentLoss / 2;
    }

    if (s.strategy == 'levels') {
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = s.percentLoss + fee;
        trailingStopStartOrderPerc = fee;
        trailingStopTriggerPriceStepPerc = s.percentLoss;
        trailingStopOrderDistancePerc = s.percentLoss;
    }

    openedPositions[pKey] = new Position({
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
        symbolInfo: _symbolsObj[s.symbol],
        trailingStopStartTriggerPricePerc,
        trailingStopStartOrderPerc,
        trailingStopTriggerPriceStepPerc,
        trailingStopOrderDistancePerc,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator,
        useTrailingStop,
        setTakeProfit,
        takeProfitPerc
    });

    openedPositions[pKey].setOrders();

    // if (s.signal == 'scalping') {

    // } else {
    //     // botPositions[pKey].setEntryOrder().then((res) => {
    //     //     console.log(res);

    //     //     if (res.error) {
    //     //         positions--;
    //     //     }
    //     // });
    // }

    openedPositions[pKey].deletePosition = function (opt?: any) {
        if (opt) {
            if (opt.excludeKey) {
                excludedPositions.push(opt.excludeKey);

                console.log('EXCLUDED =' + this.positionKey);

            } else if (opt.excludeKey === null) {
                excludedPositions = [];
            }
        }

        if (this.initiator == 'bot') {
            botPositions--;
        }

        console.log('DELETE =' + this.positionKey + '= POSITION OBJECT');

        delete openedPositions[this.positionKey];
    }

    console.log('trade.ts -> OpenPosition -> openedPositions');
    console.log(openedPositions);
}