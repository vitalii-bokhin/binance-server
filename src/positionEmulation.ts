import { symbolCandlesTicksStream } from "./binance_api/CandlesTicksStream";
import { GetData, SaveData } from './db/db';

export class PositionEmulation {
    positionKey: string;
    position: 'long' | 'short';
    symbol: string;
    entryPrice: number;
    realEntryPrice: number;
    quantity: number;
    takeProfit: number;
    fee: number;
    usdtAmount: number;
    leverage: number;
    stopLossHasBeenMoved: boolean = false;
    marketCloseOrderHasBeenCalled: boolean = false;
    stopLossClientOrderId: string;
    entryClientOrderId: string;
    symbols: string[];
    symbolInfo: {
        quantityPrecision: number;
        pricePrecision: number;
        minMarketLotSize: number;
    };
    trailingStopStartTriggerPricePerc: number;
    trailingStopStartOrderPerc: number;
    trailingStopTriggerPriceStepPerc: number;
    trailingStopOrderDistancePerc: number;
    trailingSteps: number = 0;
    signal?: string;
    expectedProfit?: number;
    interval: string;
    limit: number;
    rsiPeriod?: number;
    percentLoss: number;
    signalDetails?: any;
    deletePosition: (opt?: any) => void;
    setTakeProfit: boolean;
    takeProfitPerc: number;
    useTrailingStop: boolean;
    initiator: 'bot' | 'user';
    lossAmount: number;
    stopLossPrice: number;
    takeProfitPrice: number;

    constructor(opt: {
        positionKey: string;
        position: 'long' | 'short';
        symbol: string;
        entryPrice: number;
        takeProfit: number;
        fee: number;
        leverage: number;
        symbols: string[];
        symbolInfo: {
            quantityPrecision: number;
            pricePrecision: number;
            minMarketLotSize: number;
        };
        trailingStopStartTriggerPricePerc: number;
        trailingStopStartOrderPerc: number;
        trailingStopTriggerPriceStepPerc: number;
        trailingStopOrderDistancePerc: number;
        signal?: string;
        expectedProfit?: number;
        interval: string;
        limit: number;
        rsiPeriod?: number;
        percentLoss: number;
        signalDetails?: any;
        setTakeProfit?: boolean;
        takeProfitPerc?: number;
        useTrailingStop?: boolean;
        initiator: 'bot' | 'user';
        lossAmount: number;
    }) {
        this.positionKey = opt.positionKey;
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.entryPrice = opt.entryPrice;
        this.takeProfit = opt.takeProfit;
        this.fee = opt.fee;
        this.leverage = opt.leverage;
        this.symbols = opt.symbols;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopStartTriggerPricePerc = opt.trailingStopStartTriggerPricePerc;
        this.trailingStopStartOrderPerc = opt.trailingStopStartOrderPerc;
        this.trailingStopTriggerPriceStepPerc = opt.trailingStopTriggerPriceStepPerc;
        this.trailingStopOrderDistancePerc = opt.trailingStopOrderDistancePerc;
        this.signal = opt.signal;
        this.interval = opt.interval;
        this.limit = opt.limit;
        this.rsiPeriod = opt.rsiPeriod;
        this.percentLoss = opt.percentLoss;
        this.signalDetails = opt.signalDetails;
        this.setTakeProfit = opt.setTakeProfit !== undefined ? opt.setTakeProfit : false;
        this.takeProfitPerc = opt.takeProfitPerc !== undefined ? opt.takeProfitPerc : null;
        this.useTrailingStop = opt.useTrailingStop !== undefined ? opt.useTrailingStop : false;
        this.initiator = opt.initiator;
        this.lossAmount = opt.lossAmount;
    }

    async setOrders(): Promise<void> {
        // watch
        this.watchPosition();

        // entry
        let usdtAmount = this.lossAmount * (100 / this.percentLoss - this.fee);

        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);

        console.log('Position -> setOrders -> ', { quantity, usdtAmount });

        this.quantity = quantity;

        this.entryOrderOpened();
    }

    entryOrderOpened(): void {
        this.realEntryPrice = this.entryPrice;

        // take profit
        if (this.setTakeProfit) {
            let profitPrice: number;

            const profitPercent = (this.takeProfitPerc || this.percentLoss) + this.fee;
            const multiplier = this.realEntryPrice / 100;

            if (this.position === 'long') {
                profitPrice = this.realEntryPrice + (profitPercent * multiplier);
            } else {
                profitPrice = this.realEntryPrice - (profitPercent * multiplier);
            }

            profitPrice = +profitPrice.toFixed(this.symbolInfo.pricePrecision);

            this.takeProfitPrice = profitPrice;
        }

        // stop loss
        let stopPrice: number;

        if (this.position === 'long') {
            stopPrice = this.realEntryPrice - (this.percentLoss * (this.realEntryPrice / 100));
        } else {
            stopPrice = this.realEntryPrice + (this.percentLoss * (this.realEntryPrice / 100));
        }

        stopPrice = +stopPrice.toFixed(this.symbolInfo.pricePrecision);

        this.stopLossPrice = stopPrice;
    }

    watchPosition(): void {
        symbolCandlesTicksStream(this.symbol, data => {
            const lastPrice = data[data.length - 1].close;

            if (this.position === 'long') {
                if (lastPrice >= this.takeProfitPrice) {
                    this.logPosition('profit', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                } else if (lastPrice <= this.stopLossPrice) {
                    this.logPosition('loss', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
            } else {
                if (lastPrice <= this.takeProfitPrice) {
                    this.logPosition('profit', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                } else if (lastPrice >= this.stopLossPrice) {
                    this.logPosition('loss', this.lossAmount);
                    this.deletePositionInner({ clearExcludedSymbols: true });
                }
            }
        });
    }

    async logPosition(type: 'profit' | 'loss', amount: number) {
        let wallet = await GetData<any>('wallet');

        if (!wallet) {
            wallet = {};
        }

        if (!wallet[this.signal]) {
            wallet[this.signal] = 100;
        }

        if (type === 'profit') {
            wallet[this.signal] += amount;
        } else {
            wallet[this.signal] -= amount;
        }

        await SaveData('wallet', wallet);
    }

    deletePositionInner(opt?: any) {
        symbolCandlesTicksStream(this.symbol, null, true);

        if (this.deletePosition !== undefined) {
            this.deletePosition(opt);
        }
    }
}