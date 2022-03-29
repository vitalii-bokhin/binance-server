import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';
import { ordersUpdateStream, positionUpdateStream, priceStream } from './binanceApi';

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
    takeProfit: number;
    fee: number;
    usdtAmount: number;
    leverage: number;
    stopLossHasBeenMoved: boolean = false;
    stopLossClientOrderId: string;
    entryClientOrderId: string;
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
        takeProfit: number;
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
        this.takeProfit = opt.takeProfit;
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
        errorMsg?: string;
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

    // SCALPING Orders
    async setScalpingOrders(): Promise<{
        entryOrder?: any;
        stopLossOrder?: any;
        error?: string;
        errorMsg?: string;
        positionKey?: string;
    }> {
        this.entryClientOrderId = 'luf21_scalp_' + this.symbol;

        ordersUpdateStream(this.symbol, order => {
            if (order.clientOrderId == this.entryClientOrderId && order.orderStatus == 'FILLED') {
                const entryPrice = +order.averagePrice;

                // take profit
                const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const profitParams = {
                    type: 'TAKE_PROFIT_MARKET',
                    closePosition: true,
                    workingType: 'MARK_PRICE',
                    stopPrice: null
                };

                if (this.position === 'long') {
                    profitParams.stopPrice = entryPrice + ((this.expectedProfit + this.fee) * (entryPrice / 100));
                } else {
                    profitParams.stopPrice = entryPrice - ((this.expectedProfit + this.fee) * (entryPrice / 100));
                }

                profitParams.stopPrice = +profitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

                binanceAuth.futuresOrder(profitSide, this.symbol, false, false, profitParams).then(ord => {
                    console.log(ord);
                });

                // stop loss
                const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const exitParams = {
                    type: 'STOP_MARKET',
                    closePosition: true,
                    workingType: 'MARK_PRICE',
                    stopPrice: null
                };

                if (this.position === 'long') {
                    exitParams.stopPrice = entryPrice - ((this.possibleLoss - this.fee) * (entryPrice / 100));
                } else {
                    exitParams.stopPrice = entryPrice + ((this.possibleLoss - this.fee) * (entryPrice / 100));
                }

                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    console.log(ord);
                });
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

        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);

        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';

        if (this.position === 'long') {
            this.usdtAmount = .05 * (100 / ((this.entryPrice - this.stopLoss) / (this.entryPrice / 100) - this.fee));
        } else {
            this.usdtAmount = .05 * (100 / ((this.stopLoss - this.entryPrice) / (this.entryPrice / 100) - this.fee));
        }

        console.log('Amount');
        console.log(this.usdtAmount);

        const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
        const entryParams = {
            type: 'MARKET',
            workingType: 'MARK_PRICE',
            newClientOrderId: this.entryClientOrderId
        };

        if (quantity == 0) {
            return { error: 'QUANTITY_IS_NULL', positionKey: this.positionKey };
        }

        if (this.usdtAmount < 5) {
            return { error: 'SMALL_AMOUNT', errorMsg: 'Amount: ' + this.usdtAmount, positionKey: this.positionKey };
        }

        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);

        return { entryOrder: entryOrd };
    }

    // WATCH POSITION
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