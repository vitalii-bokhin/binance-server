import { ordersUpdateStream } from './binance_api/binanceApi';
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Bot, ManageTradeLines } from './bot';
import { Position } from './position';
import { SymbolResult } from './strategy/types';
import getSymbols from './symbols';

const fee: number = .08,
    interval: string = '5m',
    limit: number = 100,
    leverage: number = 5;

const openedPositions: {
    [key: string]: Position;
} = {};

const excludedPositions: string[] = [];
let botPositions = 0;

export let _symbols: string[]; //= ['ZILUSDT', 'WAVESUSDT'];

let _symbolsObj: { [key: string]: any };

(async function () {
    const { symbols, symbolsObj } = await getSymbols();

    _symbols = ['GMTUSDT', 'ZILUSDT', 'WAVESUSDT']; //symbols;
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
        || (initiator == 'bot' && botPositions == 2)
        || s.percentLoss < fee
    ) {
        return;
    }

    if (initiator == 'bot') {
        botPositions++;
    }

    let trailingStopStartTriggerPrice: number;
    let trailingStopStartOrder: number;
    let trailingStopTriggerPriceStep: number;
    let trailingStopOrderStep: number;

    if (s.strategy == 'levels' || s.strategy == 'manual') {
        trailingStopStartTriggerPrice = s.percentLoss;
        trailingStopStartOrder = s.percentLoss / 2;
        trailingStopTriggerPriceStep = s.percentLoss;
        trailingStopOrderStep = s.percentLoss;
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
        trailingStopStartTriggerPrice,
        trailingStopStartOrder,
        trailingStopTriggerPriceStep,
        trailingStopOrderStep,
        signal: s.signal,
        interval,
        limit,
        rsiPeriod: s.rsiPeriod,
        signalDetails: s.signalDetails,
        initiator
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

    openedPositions[pKey].deletePosition = function (positionKey, opt) {
        if (opt && opt.excludeKey) {
            excludedPositions.push(opt.excludeKey);
            console.log('EXCLUDED =' + this.positionKey);
        }

        delete openedPositions[positionKey];

        if (this.initiator == 'bot') {
            botPositions--;
        }

        console.log('DELETE =' + positionKey + '= POSITION OBJECT');
    }
}