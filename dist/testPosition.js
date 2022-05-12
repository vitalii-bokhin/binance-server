"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestPosition = void 0;
class TestPosition {
    constructor(opt) {
        this.stopLossHasBeenMoved = false;
        this.marketCloseOrderHasBeenCalled = false;
        this.trailingSteps = 0;
        this.lossAmount = .5;
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
    async setOrders() {
    }
    watchOrder() {
    }
    watchPosition() {
    }
    async moveStopLoss() {
    }
    closePositionMarket(lastPrice) {
    }
    deletePositionInner(opt) {
    }
}
exports.TestPosition = TestPosition;
//# sourceMappingURL=testPosition.js.map