'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const user = require('./user'), chart = require('./chart');
const Order = function (userId, opt, callback, isTask) {
    const priceN = (opt.price_step.includes('.')) ? opt.price_step.split('.')[1].length : 0;
    opt.price = (opt.price) ? Number(opt.price.toFixed(priceN)) : null;
    opt.stop = (opt.stop) ? Number(opt.stop.toFixed(priceN)) : null;
    opt.limit = (opt.limit) ? Number(opt.limit.toFixed(priceN)) : null;
    console.log('opt new order', opt);
    if (opt.side == 'BUY') {
        switch (opt.type) {
            case 'STOP-LOSS':
                const ordType = 'STOP_LOSS_LIMIT';
                user(userId).bin.buy(opt.symbol, opt.quantity, opt.limit, { stopPrice: opt.stop, type: ordType }, (error, response) => {
                    if (error) {
                        const err = JSON.parse(error.body);
                        callback({ error: err, status: 'error', msg: err.msg });
                        return;
                    }
                    callback({ status: 'success', data: response });
                });
                break;
            default:
                break;
        }
    }
    else if (opt.side == 'SELL') {
        switch (opt.type) {
            case 'MARKET':
                user(userId).bin.marketSell(opt.symbol, opt.quantity);
                break;
            case 'STOP-LOSS':
                const ordType = 'STOP_LOSS_LIMIT';
                user(userId).bin.sell(opt.symbol, opt.quantity, opt.limit, { stopPrice: opt.stop, type: ordType }, (error, response) => {
                    if (error) {
                        const err = JSON.parse(error.body);
                        callback({ error: err, status: 'error', msg: err.msg });
                        return;
                    }
                    callback({ status: 'success', data: response });
                });
                break;
            case 'STOP-LIMIT':
                chart.lastSymbolsPrice(opt.symbol, function (res) {
                    let ordType = 'STOP_LOSS_LIMIT';
                    if (res < opt.stop) {
                        ordType = 'TAKE_PROFIT_LIMIT';
                    }
                    user(userId).bin.sell(opt.symbol, opt.quantity, opt.limit, { stopPrice: opt.stop, type: ordType }, (error, response) => {
                        if (error) {
                            const err = JSON.parse(error.body);
                            callback({ error: err.msg, status: 'error', msg: err.msg });
                            return;
                        }
                        callback({ status: 'success', data: response });
                    });
                });
                break;
            case 'OCO':
                user(userId).bin.sell(opt.symbol, opt.quantity, opt.price, { type: opt.type, stopPrice: opt.stop, stopLimitPrice: opt.limit }, (error, res) => {
                    if (error) {
                        const err = JSON.parse(error.body);
                        callback({ error: err.msg, status: 'error', msg: err.msg });
                        return;
                    }
                    callback({ status: 'success' });
                });
                break;
            default:
                break;
        }
    }
};
module.exports = Order;
//# sourceMappingURL=order.js.map