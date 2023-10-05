import PositionEmulation from './PositionEmulation';
import { Position, PositionOptions } from './types';

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

// (async function () {
//     const { symbols, symbolsObj } = await getSymbols();

//     _symbols = ['GALUSDT', 'MANAUSDT', 'GMTUSDT', 'TRXUSDT', 'NEARUSDT', 'ZILUSDT', 'APEUSDT', 'WAVESUSDT', 'ADAUSDT', 'FTMUSDT', 'MATICUSDT'];
//     _symbolsObj = symbolsObj;

//     CandlesTicksStream({ symbols: _symbols, interval, limit }, null);

//     ordersUpdateStream();

//     console.log(`Trade has been run. Candles (${limit}) with interval: ${interval}. Leverage: ${leverage}.`);
// })();

export function openPosition(props: Position) {
    const pKey = props.symbol;

    if (openedPositions[pKey]) return;

    let trailingStopStartTriggerPricePerc: number;
    let trailingStopStartOrderPerc: number;
    let trailingStopTriggerPriceStepPerc: number;
    let trailingStopOrderDistancePerc: number;
    let takeProfitPerc: number;
    let setTakeProfit: boolean;
    let useTrailingStop: boolean;

    const atrPerc = props.atr / (s.entryPrice / 100);

    if (s.strategy == 'follow_candle') {
        setTakeProfit = true;
        // takeProfitPerc = atrPerc / 5;
        takeProfitPerc = props.percentLoss / 10;
    }

    if (s.strategy == 'traders_force') {
        setTakeProfit = true;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = props.percentLoss / 2;
        trailingStopStartOrderPerc = fee;
        // takeProfitPerc = props.percentLoss / 2;
    }

    if (s.strategy == 'patterns') {
        setTakeProfit = true;
        takeProfitPerc = props.percentLoss;
    }

    if (s.strategy == 'manual' || props.strategy == 'levels') {
        setTakeProfit = true;
        takeProfitPerc = props.percentLoss;
        useTrailingStop = true;
        trailingStopStartTriggerPricePerc = props.percentLoss / 2;
        trailingStopStartOrderPerc = fee;
    }

    // if (s.strategy == 'levels') {
    //     setTakeProfit = true;
    //     takeProfitPerc = props.percentLoss;
    //     useTrailingStop = true;
    //     trailingStopStartTriggerPricePerc = props.percentLoss * .5;
    //     trailingStopStartOrderPerc = props.percentLoss * -0.5;
    //     trailingStopTriggerPriceStepPerc = props.percentLoss * .4;
    //     trailingStopOrderDistancePerc = props.percentLoss * .9;
    // }

    // openedPositions[pKey] = new Position({
    //     positionKey: pKey,
    //     position: props.position,
    //     symbol: props.symbol,
    //     expectedProfit: props.expectedProfit,
    //     entryPrice: props.entryPrice,
    //     takeProfit: props.takeProfit,
    //     percentLoss: props.percentLoss,
    //     fee,
    //     leverage,
    //     symbols: _symbols,
    //     symbolInfo: _symbolsObj[s.symbol],
    //     trailingStopStartTriggerPricePerc,
    //     trailingStopStartOrderPerc,
    //     trailingStopTriggerPriceStepPerc,
    //     trailingStopOrderDistancePerc,
    //     signal: props.signal,
    //     interval,
    //     limit,
    //     rsiPeriod: props.rsiPeriod,
    //     signalDetails: props.signalDetails,
    //     initiator,
    //     useTrailingStop,
    //     setTakeProfit,
    //     takeProfitPerc,
    //     lossAmount
    // });

    openedPositions[pKey] = new PositionEmulation({
        fee,
        entryPrice: props.entryPrice,
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