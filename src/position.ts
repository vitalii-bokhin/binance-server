import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';
import { positionUpdateStream, priceStream } from './binanceApi';

const binanceAuth = new Binance().options({
    APIKEY: BINANCE_KEY,
    APISECRET: BINANCE_SECRET,
    useServerTime: true
});
// const binanceAuth = new Binance();

export class Position {
    position: 'long' | 'short';
    symbol: string;
    expectedProfit: number;
    possibleLoss: number;
    entryPrice: number;
    stopLoss: number;
    fee: number;
    usdtAmount: number;
    stopLossHasBeenMoved: boolean = false;
    stopLossClientOrderId: string;
    symbolInfo: {
        quantityPrecision: number;
        pricePrecision: number;
    };
    trailingStopLossTriggerPerc: number;
    trailingStopLossPerc: number;
    trailingStopLossStepPerc: number;
    signal?: string;

    constructor(opt: {
        position: 'long' | 'short';
        symbol: string;
        expectedProfit: number;
        possibleLoss: number;
        entryPrice: number;
        stopLoss: number;
        fee: number;
        usdtAmount: number;
        symbolInfo: {
            quantityPrecision: number;
            pricePrecision: number;
        };
        trailingStopLossStepPerc: number;
        signal?: string;
    }) {
        this.position = opt.position;
        this.symbol = opt.symbol;
        this.expectedProfit = opt.expectedProfit;
        this.possibleLoss = opt.possibleLoss;
        this.entryPrice = opt.entryPrice;
        this.stopLoss = opt.stopLoss;
        this.fee = opt.fee;
        this.usdtAmount = opt.usdtAmount;
        this.symbolInfo = opt.symbolInfo;
        this.trailingStopLossTriggerPerc = .2; // first trailing move
        this.trailingStopLossPerc = .1; // first trailing move
        this.trailingStopLossStepPerc = +(opt.trailingStopLossStepPerc - .2).toFixed(2);
        this.signal = opt.signal;
    }

    async setEntryOrder() {
        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, 1);

        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            timeInForce: 'GTC'
        };

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

        return [entryOrd, stopOrd];
    }

    watchPosition() {
        priceStream(this.symbol, price => {
            if (!this.stopLossHasBeenMoved) {
                let changePerc: number;

                if (this.position === 'long') {
                    changePerc = (+price.markPrice - this.entryPrice) / (this.entryPrice / 100);
                } else {
                    changePerc = (this.entryPrice - (+price.markPrice)) / (this.entryPrice / 100);
                }

                if (changePerc > this.trailingStopLossTriggerPerc) {
                    this.stopLossHasBeenMoved = true;

                    this.moveStopLoss();
                }
            }
        });

        positionUpdateStream(this.symbol, pos => {
            console.log('--position--');
            console.log(pos);
        });
    }

    async moveStopLoss() {
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });

        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            workingType: 'MARK_PRICE',
            stopPrice: 0
        };

        if (this.position === 'long') {
            exitParams.stopPrice = this.entryPrice + (this.trailingStopLossPerc * (this.entryPrice / 100));
        } else {
            exitParams.stopPrice = this.entryPrice - (this.trailingStopLossPerc * (this.entryPrice / 100));
        }

        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        this.stopLossClientOrderId = stopOrd.clientOrderId;

        this.trailingStopLossTriggerPerc = this.trailingStopLossTriggerPerc + this.trailingStopLossStepPerc;
        this.trailingStopLossPerc = this.trailingStopLossPerc + this.trailingStopLossStepPerc;

        this.stopLossHasBeenMoved = false;
    }
}