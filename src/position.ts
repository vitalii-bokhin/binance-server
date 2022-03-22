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
    status: 'pending' | 'active' | 'closed';
    fee: number;
    usdtAmount: number;
    stopLossHasBeenMoved: boolean = false;
    stopLossClientOrderId: string;
    symbolInfo: {
        quantityPrecision: number;
        pricePrecision: number;
    };
    trailingStopLossDistance: number;

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
        this.trailingStopLossDistance = this.fee * 2;
    }

    async setEntryOrder() {
        this.watchPosition();

        this.status = 'pending';

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
            stopPrice: this.stopLoss
        };

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        this.stopLossClientOrderId = stopOrd.clientOrderId;

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

                if (changePerc > this.trailingStopLossDistance) {
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
        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: 0
        };

        if (this.position === 'long') {
            exitParams.stopPrice = this.entryPrice + (this.fee * (this.entryPrice / 100));
        } else {
            exitParams.stopPrice = this.entryPrice - (this.fee * (this.entryPrice / 100));
        }
ss
        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

        await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });

        this.trailingStopLossDistance = this.trailingStopLossDistance + this.fee * 2;

        this.stopLossHasBeenMoved = false;
    }
}