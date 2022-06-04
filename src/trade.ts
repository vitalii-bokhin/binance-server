import { SymbolResult } from './strategy/types';
import getSymbols from './binance_api/symbols';
import { ordersUpdateStream } from './binance_api/binanceApi';
import { CandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { Position } from './position';
import { PositionEmulation } from './positionEmulation';

const fee: number = .08,
    interval: string = '1h',
    limit: number = 99, // candles ticks limit
    leverage: number = 20,
    maxBotPositions: number = 7,
    lossAmount: number = 1;

export const openedPositions: {
    // [key: string]: Position;
    [key: string]: PositionEmulation;
} = {};

let excludedSymbols: Set<string> = new Set();
let botPositions = 0;

export let _symbols: string[];

let _symbolsObj: { [key: string]: any };

(async function () {
    const { symbols, symbolsObj } = await getSymbols();

    _symbols = ['GALUSDT', 'MANAUSDT', 'GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT', 'FTMUSDT', 'MATICUSDT'];
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
    // console.log('excludedSymbols', excludedSymbols);
    // console.log('initiator', initiator);
    // console.log('botPositions', botPositions);
    // console.log('s.percentLoss', s.percentLoss);
    // console.log('******************************************************');

    if (
        openedPositions[pKey]
        || excludedSymbols.has(pKey)
        || !s.resolvePosition
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

    if (s.strategy == 'patterns') {
        setTakeProfit = true;
        takeProfitPerc = s.percentLoss;
    }

    if (s.strategy == 'manual' || s.strategy == 'levels') {
        setTakeProfit = true;
        takeProfitPerc = s.percentLoss;
    }

    // if (s.strategy == 'levels') {
    //     setTakeProfit = true;
    //     takeProfitPerc = s.percentLoss;
    //     useTrailingStop = true;
    //     trailingStopStartTriggerPricePerc = s.percentLoss * .5;
    //     trailingStopStartOrderPerc = s.percentLoss * -0.5;
    //     trailingStopTriggerPriceStepPerc = s.percentLoss * .4;
    //     trailingStopOrderDistancePerc = s.percentLoss * .9;
    // }

    // openedPositions[pKey] = new Position({
    //     positionKey: pKey,
    //     position: s.position,
    //     symbol: s.symbol,
    //     expectedProfit: s.expectedProfit,
    //     entryPrice: s.entryPrice,
    //     takeProfit: s.takeProfit,
    //     percentLoss: s.percentLoss,
    //     fee,
    //     leverage,
    //     symbols: _symbols,
    //     symbolInfo: _symbolsObj[s.symbol],
    //     trailingStopStartTriggerPricePerc,
    //     trailingStopStartOrderPerc,
    //     trailingStopTriggerPriceStepPerc,
    //     trailingStopOrderDistancePerc,
    //     signal: s.signal,
    //     interval,
    //     limit,
    //     rsiPeriod: s.rsiPeriod,
    //     signalDetails: s.signalDetails,
    //     initiator,
    //     useTrailingStop,
    //     setTakeProfit,
    //     takeProfitPerc,
    //     lossAmount
    // });

    openedPositions[pKey] = new PositionEmulation({
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
        takeProfitPerc,
        lossAmount
    });

    openedPositions[pKey].setOrders();

    openedPositions[pKey].deletePosition = function (opt?: any) {
        if (opt) {
            if (opt.excludeKey && this.initiator == 'bot') {
                excludedSymbols.add(opt.excludeKey);

                console.log('EXCLUDED =' + opt.excludeKey);

            } else if (opt.clearExcludedSymbols) {
                excludedSymbols.clear();
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