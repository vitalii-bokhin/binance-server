import { InputTime } from '../indicators/types';

export type SymbolResult = {
    symbol: string;
    position: 'long' | 'short';
    entryPrice: number;
    signal: string;
    signalDetails?: any;
    percentLoss?: number;
    preferIndex?: number;
    takeProfit?: number;
    possibleLoss?: number;
    expectedProfit?: number;
    rsiPeriod?: number;
    resolvePosition: boolean;
};

export type Result = SymbolResult[];

export type Candle = {
    high: number;
    open: number;
    close: number;
    low: number;
    openTime: number;
    closeTime: number;
};

export type CdlDir = 'up' | 'down';

export type TiSettings = {
    smaPeriod: number;
    rsiPeriod: number;
    atrPeriod: number;
    tdlLines?: {
        [symbol: string]: {
            tdlTopLineOpt: {
                price: number;
                time: InputTime;
            }[];
            tdlbottomLineOpt: {
                price: number;
                time: InputTime;
            }[];
        }
    };
};

export type Entry = {
    symbol: string;
    candlesData: Candle[];
    fee?: number;
    limit?: number;
    tiSettings?: TiSettings
};