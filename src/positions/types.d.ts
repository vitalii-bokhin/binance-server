export interface Position {
    symbol: string;
    position: 'long' | 'short';
    fee: number;
    entryPrice: number;
    quantity: number;
    takeProfit: number;


    realEntryPrice: number;
    usdtAmount: number;
    leverage: number;
    stopLossHasBeenMoved: boolean;
    marketCloseOrderHasBeenCalled: boolean;
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
    trailingSteps: number;
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
}
