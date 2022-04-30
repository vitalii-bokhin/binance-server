import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from './config';
import { ordersUpdateStream, positionUpdateStream } from './binance_api/binanceApi';
import { symbolCandlesTicksStream } from "./binance_api/CandlesTicksStream";

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
    async setOrders(): Promise<void> {
        this.entryClientOrderId = 'luf21_scalp_' + this.symbol;

        // watch
        this.watchOrder();
        this.watchPosition();

        // leverage
        const lvr = await binanceAuth.futuresLeverage(this.symbol, this.leverage);

        // entry
        const entrySide = this.position === 'long' ? 'BUY' : 'SELL';

        let usdtAmount = this.lossAmount * (100 / this.percentLoss - this.fee);

        const quantity = +(usdtAmount / this.entryPrice).toFixed(this.symbolInfo.quantityPrecision);

        console.log('Position -> setOrders -> ', { quantity, usdtAmount });

        const entryParams = {
            type: 'MARKET',
            newClientOrderId: this.entryClientOrderId
        };

        if (quantity < this.symbolInfo.minMarketLotSize) {
            console.log(`Position -> setOrders() -> Error: 'SMALL_LOT_SIZE', errorMsg: 'Min: ' + ${this.symbolInfo.minMarketLotSize} + '; Current: ' + ${quantity}, positionKey: ${this.positionKey}`);

            this.deletePositionInner({ excludeKey: this.positionKey });

            return;
        }

        if (usdtAmount < 5) {
            console.log(`Position -> setOrders() -> Error: 'SMALL_AMOUNT', errorMsg: 'Small Amount: ' + ${usdtAmount}, positionKey: ${this.positionKey}`);

            this.deletePositionInner({ excludeKey: this.positionKey });

            return;
        }

        const entryOrd = await binanceAuth.futuresOrder(entrySide, this.symbol, quantity, false, entryParams);

        console.log('Position -> setOrders() -> entryOrd');
        console.log(entryOrd);

        this.quantity = +entryOrd.origQty;

        if (entryOrd.code == -4164) {
            this.deletePositionInner({ excludeKey: this.positionKey });
        }
    }

    watchOrder(): void {
        ordersUpdateStream(this.symbol, order => {
            if (order.clientOrderId == this.entryClientOrderId && order.orderStatus == 'FILLED') {

                this.realEntryPrice = +order.averagePrice;

                // take profit
                if (this.setTakeProfit) {
                    const profitSide = this.position === 'long' ? 'SELL' : 'BUY';
                    const profitParams = {
                        type: 'LIMIT',
                        timeInForce: 'GTC',
                        reduceOnly: true
                    };

                    let stopPrice: number;

                    const profitPercent = (this.takeProfitPerc || this.percentLoss) + this.fee;
                    const multiplier = this.realEntryPrice / 100;

                    if (this.position === 'long') {
                        stopPrice = this.realEntryPrice + (profitPercent * multiplier);
                    } else {
                        stopPrice = this.realEntryPrice - (profitPercent * multiplier);
                    }

                    stopPrice = +stopPrice.toFixed(this.symbolInfo.pricePrecision);

                    binanceAuth.futuresOrder(profitSide, this.symbol, this.quantity, stopPrice, profitParams)
                        .then(arg => {
                            console.log('Position -> watchOrder() -> take profit order');
                            console.log(arg);
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
                    exitParams.stopPrice = this.realEntryPrice - (this.percentLoss * (this.realEntryPrice / 100));
                } else {
                    exitParams.stopPrice = this.realEntryPrice + (this.percentLoss * (this.realEntryPrice / 100));
                }

                exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

                binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams).then(ord => {
                    this.stopLossClientOrderId = ord.clientOrderId;
                    
                    console.log('Position -> watchOrder() -> stop loss order');
                    console.log(ord);
                });
            }
        });
    }

    watchPosition(): void {
        symbolCandlesTicksStream(this.symbol, data => {
            const lastPrice = data[data.length - 1].close;

            if (!this.stopLossHasBeenMoved && this.useTrailingStop) {
                let changePerc: number;

                const triggerPerc = this.trailingSteps === 0 ? this.trailingStopStartTriggerPricePerc : this.trailingStopStartTriggerPricePerc + this.trailingStopTriggerPriceStepPerc * this.trailingSteps;

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
            if (pos.positionAmount == '0') {
                this.deletePositionInner({ excludeKey: null });
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

        let percentLoss: number;

        if (this.trailingSteps === 0) {
            percentLoss = this.trailingStopStartOrderPerc;
        } else {
            percentLoss = this.trailingStopStartTriggerPricePerc + this.trailingStopTriggerPriceStepPerc * this.trailingSteps - this.trailingStopOrderDistancePerc;

            if (percentLoss <= this.trailingStopStartOrderPerc) {
                percentLoss = this.trailingStopStartOrderPerc;
            }
        }

        if (this.position === 'long') {
            exitParams.stopPrice = this.realEntryPrice + ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        } else {
            exitParams.stopPrice = this.realEntryPrice - ((percentLoss + this.fee) * (this.realEntryPrice / 100));
        }

        exitParams.stopPrice = +exitParams.stopPrice.toFixed(this.symbolInfo.pricePrecision);

        const stopOrd = await binanceAuth.futuresOrder(exitSide, this.symbol, false, false, exitParams);

        console.log('Position -> moveStopLoss() -> trailing stop order');
        console.log(stopOrd);

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
                this.deletePosition(opt);
            }
        });
    }
}