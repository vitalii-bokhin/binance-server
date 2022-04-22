import { ordersUpdateStream } from './binance_api/binanceApi';
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Bot, ManageTradeLines } from './bot';
import { Position } from './position';
import { SymbolResult } from './strategy/types';
import getSymbols from './symbols';

const fee: number = .08,
    interval: string = '5m',
    limit: number = 100,
    leverage: number = 10;

const openedPositions: {
    [key: string]: Position;
} = {};

const excludedPositions: string[] = [];
let botPositions = 0;

export let _symbols: string[];

let _symbolsObj: { [key: string]: any };

(async function () {
    const { symbols, symbolsObj } = await getSymbols();

    _symbols = symbols; // ['GMTUSDT', 'ZILUSDT', 'WAVESUSDT', 'MATICUSDT']; //symbols;
    _symbolsObj = symbolsObj;

    CandlesTicksStream({ symbols: _symbols, interval, limit }, null);

    ordersUpdateStream();

    console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
})();

export function OpenPosition(s: SymbolResult, initiator: 'bot' | 'user') {
    const pKey = s.symbol;

    if (
        openedPositions[pKey]
        || !s.resolvePosition
        || excludedPositions.includes(pKey)
        || (initiator == 'bot' && botPositions >= 1)
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
    let trailingStopOrderStepPerc: number;

    if (s.strategy == 'trend') {
        trailingStopStartTriggerPricePerc = .3;
        trailingStopStartOrderPerc = fee;
        trailingStopTriggerPriceStepPerc = s.percentLoss;
        trailingStopOrderStepPerc = s.percentLoss;
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
        trailingStopOrderStepPerc,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator,
        useTrailingStop: s.strategy === 'trend',
        setTakeProfit: s.strategy !== 'trend'
    });

    openedPositions[pKey].setOrders().then(res => {
        console.log(res);
    });

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
        if (opt && opt.excludeKey) {
            excludedPositions.push(opt.excludeKey);
            console.log('EXCLUDED =' + this.positionKey);
        }

        delete openedPositions[this.positionKey];

        if (this.initiator == 'bot') {
            botPositions--;
        }

        console.log('DELETE =' + this.positionKey + '= POSITION OBJECT');
    }

    console.log(openedPositions);
}