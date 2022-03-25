import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';
import { positionUpdateStream, priceStream } from './binanceApi';

const binanceAuth = new Binance().options({
    APIKEY: BINANCE_KEY,
    APISECRET: BINANCE_SECRET,
    useServerTime: true
});

export class Position {
    positionKey: string;
    position: 'long' | 'short';
    symbol: string;
    entryPrice: number;
    stopLoss: number;
    fee: number;
    usdtAmount: number;
    leverage: number;
    stopLossHasBeenMoved: boolean = false;
    stopLossClientOrderId: string;
    symbolInfo: {
        quantityPrecision: number;
        pricePrecision: number;
    };
    trailingStopTriggerPerc: number;
    trailingStopPricePerc: number;
    trailingStepPerc: number;
    signal?: string;
    expectedProfit?: number;
    possibleLoss?: number;
    deletePositionCallback: (positionKey: string) => void;

    constructor(opt: {
        positionKey: string;
        position: 'long' | 'short';
        symbol: string;
        entryPrice: number;
        stopLoss: number;
        fee: number;
        usdtAmount: number;
        leverage: number;
        symbolInfo: {
            quantityPrecision: number;
            pricePrecision: number;
        };
        trailingStopTriggerPerc: number;
        trailingStopPricePerc: number;
        trailingStepPerc: number;
        signal?: string;
        expectedProfit?: number;
        possibleLoss?: number;
    }) {
        this.positionKey = opt.positionKey;
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.fee = opt.fee;
        this.usdtAmount = opt.usdtAmount;
        this.leverage = opt.leverage;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopTriggerPerc = opt.trailingStopTriggerPerc; // first trailing move
        this.trailingStopPricePerc = opt.trailingStopPricePerc; // first trailing move
        this.trailingStepPerc = opt.trailingStepPerc;
        this.signal = opt.signal;
    }

    async setEntryOrder(): Promise<{
        entryOrder?: any;
        stopLossOrder?: any;
        error?: string;
        positionKey?: string;
    }> {
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);

        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            type: 'LIMIT',
            timeInForce: 'GTC',
            workingType: 'MARK_PRICE'
        };

        if (quantity == 0) {
            return { error: 'QUANTITY_IS_NULL', positionKey: this.positionKey };
        }

        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);

        // stop loss
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            workingType: 'MARK_PRICE',
            stopPrice: +this.stopLoss.toFixed(this.symbolInfo.pricePrecision)
        };

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        this.stopLossClientOrderId = stopOrd.clientOrderId;

        // watch
        this.watchPosition();

        return { entryOrder: entryOrd, stopLossOrder: stopOrd };
    }

    watchPosition(): void {
        priceStream(this.symbol, price => {
            if (!this.stopLossHasBeenMoved) {
                let changePerc: number;

                if (this.position === 'long') {
                    changePerc = (+price.markPrice - this.entryPrice) / (this.entryPrice / 100);
                } else {
                    changePerc = (this.entryPrice - (+price.markPrice)) / (this.entryPrice / 100);
                }

                if (changePerc >= this.trailingStopTriggerPerc) {
                    this.stopLossHasBeenMoved = true;

                    this.moveStopLoss();
                }
            }
        });

        positionUpdateStream(this.symbol, (pos: any) => {
            console.log('--position--');
            console.log(pos);

            if (pos.positionAmount == '0') {
                if (this.deletePositionCallback !== undefined) {
                    this.deletePositionCallback(this.positionKey);
                }
            }
        });
    }

    async moveStopLoss(): Promise<void> {
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });

        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            workingType: 'MARK_PRICE',
            stopPrice: 0
        };

        if (this.position === 'long') {
            exitParams.stopPrice = this.entryPrice + (this.trailingStopPricePerc * (this.entryPrice / 100));
        } else {
            exitParams.stopPrice = this.entryPrice - (this.trailingStopPricePerc * (this.entryPrice / 100));
        }

        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        this.stopLossClientOrderId = stopOrd.clientOrderId;

        this.trailingStopTriggerPerc = this.trailingStopTriggerPerc + this.trailingStepPerc;
        this.trailingStopPricePerc = this.trailingStopPricePerc + this.trailingStepPerc;

        this.stopLossHasBeenMoved = false;
    }

    deletePosition(callback: (positionKey: string) => void): void {
        this.deletePositionCallback = callback;
    }
}