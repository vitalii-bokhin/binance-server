import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';
import { candlesTicksStream, ordersUpdateStream, positionUpdateStream, priceStream, symbolCandlesTicksStream } from './binance_api/binanceApi';
import { RSI } from './indicators';

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
    trailingStopStartTriggerPrice: number;
    trailingStopStartOrder: number;
    trailingStopTriggerPriceStep: number;
    trailingStopOrderStep: number;
    trailingSteps: number = 0;
    signal?: string;
    expectedProfit?: number;
    interval: string;
    limit: number;
    rsiPeriod: number;
    percentLoss: number;
    signalDetails?: any;
    deletePosition: (positionKey: string, opt: any) => void;
    setTakeProfit: boolean;
    useTrailingStop: boolean;
    initiator: 'bot' | 'user';
    lossAmount: number = .1;

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
        trailingStopStartTriggerPrice: number;
        trailingStopStartOrder: number;
        trailingStopTriggerPriceStep: number;
        trailingStopOrderStep: number;
        signal?: string;
        expectedProfit?: number;
        interval: string;
        limit: number;
        rsiPeriod: number;
        percentLoss: number;
        signalDetails?: any;
        setTakeProfit?: boolean;
        useTrailingStop?: boolean;
        initiator: 'bot' | 'user';
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
        this.trailingStopStartTriggerPrice = opt.trailingStopStartTriggerPrice;
        this.trailingStopStartOrder = opt.trailingStopStartOrder;
        this.trailingStopTriggerPriceStep = opt.trailingStopTriggerPriceStep;
        this.trailingStopOrderStep = opt.trailingStopOrderStep;
        this.signal = opt.signal;
        this.interval = opt.interval;
        this.limit = opt.limit;
        this.rsiPeriod = opt.rsiPeriod;
        this.percentLoss = opt.percentLoss;
        this.signalDetails = opt.signalDetails;
        this.setTakeProfit = opt.setTakeProfit !== undefined ? opt.setTakeProfit : true;
        this.useTrailingStop = opt.useTrailingStop !== undefined ? opt.useTrailingStop : false;
        this.initiator = opt.initiator;
    }

    // async setEntryOrder(): Promise<{
    //     entryOrder?: any;
    //     stopLossOrder?: any;
    //     error?: string;
    //     errorMsg?: string;
    //     positionKey?: string;
    // }> {
    //     // leverage
    //     const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);

    //     // entry
    //     const entrySide = this.position === 'long' ? 'BUY' : 'SELL';
    //     const quantity = +(this.usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);
    //     const entryParams = {
    //         type: 'LIMIT',
    //         timeInForce: 'GTC'
    //     };

    //     if (quantity == 0) {
    //         return { error: 'QUANTITY_IS_NULL', positionKey: this.positionKey };
    //     }

    //     const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, this.entryPrice, entryParams);

    //     // stop loss
    //     const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
    //     const exitParams = {
    //         type: 'STOP_MARKET',
    //         closePosition: true,
    //         // stopPrice: +this.stopLoss.toFixed(this.symbolInfo.pricePrecision)
    //     };

    //     const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

    //     this.stopLossClientOrderId = stopOrd.clientOrderId;

    //     // watch
    //     this.watchPosition();

    //     return { entryOrder: entryOrd, stopLossOrder: stopOrd };
    // }

    // SCALPING Orders
    async setOrders(): Promise<any> {
        this.entryClientOrderId = 'luf21_scalp_' + this.symbol;

        ordersUpdateStream(this.symbol, order => {
            if (order.clientOrderId == this.entryClientOrderId && order.orderStatus == 'FILLED') {
                const entryPrice = +order.averagePrice;
                this.realEntryPrice = entryPrice;

                // take profit
                if (this.setTakeProfit) {
                    const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                    const profitParams = {
                        type: 'TAKE_PROFIT_MARKET',
                        closePosition: true,
                        stopPrice: null
                    };

                    if (this.position === 'long') {
                        profitParams.stopPrice = entryPrice + ((this.percentLoss + this.fee) * (entryPrice / 100));
                    } else {
                        profitParams.stopPrice = entryPrice - ((this.percentLoss + this.fee) * (entryPrice / 100));
                    }

                    profitParams.stopPrice = +profitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

                    binanceAuth.futuresOrder(profitSide, this.symbol, false, false, profitParams).then(ord => {
                        // console.log(ord);
                    });
                }

                // stop loss
                const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
                const exitParams = {
                    type: 'STOP_MARKET',
                    closePosition: true,
                    stopPrice: null
                };

                if (this.position === 'long') {
                    exitParams.stopPrice = entryPrice - ((this.percentLoss - this.fee) * (entryPrice / 100));
                } else {
                    exitParams.stopPrice = entryPrice + ((this.percentLoss - this.fee) * (entryPrice / 100));
                }

                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    this.stopLossClientOrderId = ord.clientOrderId;
                });
            }
        });

        // watch
        this.watchPosition();

        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);

        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';

        let usdtAmount = this.lossAmount * (100 / this.percentLoss);

        console.log({ usdtAmount });

        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);

        console.log({ quantity });

        const entryParams = {
            type: 'MARKET',
            newClientOrderId: this.entryClientOrderId
        };

        if (quantity < this.symbolInfo.minMarketLotSize) {
            console.log(` error: 'SMALL_LOT_SIZE', errorMsg: 'Min: ' + ${this.symbolInfo.minMarketLotSize} + '; Current: ' + ${quantity}, positionKey: ${this.positionKey}`);

            this.deletePositionInner({ excludeKey: this.positionKey });

            return;
        }

        if (usdtAmount < 5) {
            console.log(` error: 'SMALL_AMOUNT', errorMsg: 'Small Amount: ' + ${usdtAmount}, positionKey: ${this.positionKey}`);

            this.deletePositionInner({ excludeKey: this.positionKey });

            return;
        }

        // return {};

        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);

        this.quantity = +entryOrd.origQty;

        return { entryOrder: entryOrd };
    }

    // WATCH POSITION
    watchPosition(): void {
        symbolCandlesTicksStream(this.symbol, data => {
            const lastPrice = data[data.length - 1].close;

            if (!this.stopLossHasBeenMoved && this.useTrailingStop) {
                let changePerc: number;

                const triggerPerc = this.trailingSteps === 0 ? this.trailingStopStartTriggerPrice : this.trailingStopStartTriggerPrice + this.trailingStopTriggerPriceStep * this.trailingSteps;

                if (this.position === 'long') {
                    changePerc = (lastPrice - this.realEntryPrice) / (this.realEntryPrice / 100);
                } else {
                    changePerc = (this.realEntryPrice - lastPrice) / (this.realEntryPrice / 100);
                }

                if (changePerc >= triggerPerc) {
                    this.stopLossHasBeenMoved = true;

                    this.moveStopLoss();
                }
            }


            // const rsi = RSI({ data, period: this.rsiPeriod, symbol: this.symbol });

            // if (this.position == 'long' && rsi.last >= rsi.avgRsiAbove) {
            //     this.closePositionMarket(lastPrice);
            // } else if (this.position == 'short' && rsi.last <= rsi.avgRsiBelow) {
            //     this.closePositionMarket(lastPrice);
            // }
        });

        positionUpdateStream(this.symbol, (pos: any) => {
            console.log(pos);

            if (pos.positionAmount == '0') {
                this.deletePositionInner();
            }
        });
    }

    async moveStopLoss(): Promise<void> {
        await binanceAuth.futuresCancel(this.symbol, { origClientOrderId: this.stopLossClientOrderId });

        const exitSide = this.position === 'long' ? 'SELL' : 'BUY';
        const exitParams = {
            type: 'STOP_MARKET',
            closePosition: true,
            stopPrice: null
        };

        const percentLoss = this.trailingSteps === 0 ? this.trailingStopStartOrder : this.trailingStopStartOrder + this.trailingStopOrderStep * this.trailingSteps;

        if (this.position === 'long') {
            exitParams.stopPrice = this.realEntryPrice + ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        } else {
            exitParams.stopPrice = this.realEntryPrice - ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        }

        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        this.stopLossClientOrderId = stopOrd.clientOrderId;

        this.trailingSteps++;

        this.stopLossHasBeenMoved = false;
    }

    closePositionMarket(lastPrice: number): void {
        if (this.marketCloseOrderHasBeenCalled) {
            return;
        }

        let profit = 0;

        if (this.position === 'long') {
            profit = (lastPrice - this.realEntryPrice) / (this.realEntryPrice / 100);
        } else {
            profit = (this.realEntryPrice - lastPrice) / (this.realEntryPrice / 100);
        }

        if (profit < this.fee) {
            return;
        }

        this.marketCloseOrderHasBeenCalled = true;

        const closeSide = this.position === 'long' ? 'SELL' : 'BUY';
        const ordParams = {
            type: 'MARKET',
            reduceOnly: 'true'
        };

        // console.log(closeSide, ordParams, this.quantity, this.symbol);

        binanceAuth.futuresOrder(closeSide, this.symbol, this.quantity, false, ordParams).then(arg => {
            // console.log('Market close position');
            // console.log(arg);
        });
    }

    deletePositionInner(opt?: any) {
        ordersUpdateStream(this.symbol, null, true);
        positionUpdateStream(this.symbol, null, true);
        symbolCandlesTicksStream(this.symbol, null, true);

        binanceAuth.futuresCancelAll(this.symbol).then(() => {
            if (this.deletePosition !== undefined) {
                this.deletePosition(this.positionKey, opt);
            }
        });
    }
}