'use strict';
const user = require('./user'), chart = require('./chart'), order = require('./order');
const userTasks = {};
// traling task
function TralingTask(userId, opt, callback, id) {
    this.id = id;
    this.userId = userId;
    this.opt = opt;
    this.isTrailing = false;
    this.orderId = null;
    this.priceN = (opt.price_step.includes('.')) ? opt.price_step.split('.')[1].length : 0;
    this.processCancel = false;
    this.setOrder(null, callback);
}
TralingTask.prototype.setOrder = function (newStop, callback) {
    this.isTrailing = true;
    if (newStop !== null) {
        const stopToLimitDst = this.opt.stop - this.opt.limit, newLimit = newStop - stopToLimitDst;
        if (this.opt.side == 'BUY') {
            const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0, newQty = (this.opt.limit * this.opt.quantity) / newLimit;
            this.opt.quantity = floorTo(newQty, qtyN);
        }
        this.opt.stop = newStop;
        this.opt.limit = newLimit;
    }
    order(this.userId, this.opt, (res) => {
        if (!res.error) {
            this.orderId = res.data.orderId;
            this.isTrailing = false;
            this.processCancel = false;
        }
        else {
            if (res.error.code == -2010 && res.error.msg.includes('immediately')) {
                // this.opt.type = 'MARKET';
                // order(this.userId, this.opt);
                // delete userTasks[this.userId].tralingTasks[this.id];
                console.log('ERROR Immediately');
            }
        }
        if (callback)
            callback(res);
    }, true);
};
TralingTask.prototype.trailOrder = function (res) {
    if (this.isTrailing)
        return;
    const oneClosePerc = +res.close / 100;
    let percPrice;
    if (this.opt.buyPrice !== null &&
        +res.close - (oneClosePerc * this.opt.stop_loss_trailing_distance_if) > this.opt.buyPrice) {
        percPrice = oneClosePerc * this.opt.stop_loss_trailing_distance_2;
    }
    else {
        percPrice = oneClosePerc * this.opt.stop_loss_trailing_distance;
    }
    let newStop;
    if (this.opt.side == 'BUY') {
        newStop = +res.close + percPrice;
    }
    else if (this.opt.side == 'SELL') {
        newStop = +res.close - percPrice;
    }
    newStop = Number(newStop.toFixed(this.priceN));
    if ((this.opt.side == 'SELL' && newStop > this.opt.stop) ||
        (this.opt.side == 'BUY' && newStop < this.opt.stop)) {
        this.processCancel = true;
        this.isTrailing = true;
        user(this.userId).bin.cancel(this.opt.symbol, this.orderId, (error, response, symbol) => {
            if (response.status == 'CANCELED') {
                this.setOrder(newStop);
            }
        });
    }
};
// condition task
function ConditionTask(userId, opt) {
    this.userId = userId;
    this.opt = opt;
    this.firstBalance = null;
    this.secondBalance = null;
    this.isSetNewOrderProcess = false;
}
ConditionTask.prototype.setNewOrder = function (res, callback) {
    if (res.executionType == 'TRADE') {
        if ((this.opt.condition == 'last-buy-filled-balance-updated' ||
            this.opt.condition == 'last-buy-filled') &&
            res.side == 'BUY' &&
            res.orderStatus == 'FILLED') {
            this.isSetNewOrderProcess = true;
            this.opt.buyPrice = res.price;
            if (this.opt.stop_limit_is_auto == 'true') {
                let stop, limit;
                switch (this.opt.stop_limit_formula) {
                    case 'relative-buy-price':
                        if (this.opt.type == 'STOP-LOSS') {
                            stop = res.price - ((res.price / 100) * this.opt.auto_stop_perc);
                            limit = stop - this.opt.auto_stop_to_limit;
                        }
                        break;
                }
                this.opt.stop = stop;
                this.opt.limit = limit;
            }
            if (this.opt.condition == 'last-buy-filled-balance-updated') {
                if (this.opt.relative_quantity_of == 'deal') {
                    const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0, qty = (res.quantity / 100) * this.opt.relative_quantity;
                    this.opt.quantity = floorTo(qty, qtyN);
                    this.isSetNewOrderProcess = false;
                    if (this.opt.stop_loss_is_trailing == 'true') {
                        userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
                            callback();
                        });
                    }
                    else {
                        order(this.userId, this.opt, () => { }, true);
                    }
                }
                else if (this.opt.relative_quantity_of == 'balance') {
                    const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0;
                    let f;
                    (f = () => {
                        if (this.firstBalance !== null) {
                            const balance = this.firstBalance;
                            this.firstBalance = null;
                            const qty = (balance / 100) * this.opt.relative_quantity;
                            this.opt.quantity = floorTo(qty, qtyN);
                            this.isSetNewOrderProcess = false;
                            if (this.opt.stop_loss_is_trailing == 'true') {
                                userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
                                    callback();
                                });
                            }
                            else {
                                order(this.userId, this.opt, () => { }, true);
                            }
                        }
                        else {
                            setImmediate(f);
                        }
                    })();
                }
            }
        }
        else if ((this.opt.condition == 'last-sell-filled-balance-updated' ||
            this.opt.condition == 'last-sell-filled') &&
            res.side == 'SELL' &&
            res.orderStatus == 'FILLED') {
            this.isSetNewOrderProcess = true;
            if (this.opt.stop_limit_is_auto == 'true') {
                let stop, limit;
                switch (this.opt.stop_limit_formula) {
                    case 'relative-sell-price':
                        if (this.opt.type == 'STOP-LOSS') {
                            stop = res.price + ((res.price / 100) * this.opt.auto_stop_perc);
                            limit = stop + this.opt.auto_stop_to_limit;
                        }
                        break;
                }
                this.opt.stop = stop;
                this.opt.limit = limit;
            }
            if (this.opt.condition == 'last-sell-filled-balance-updated') {
                if (this.opt.relative_quantity_of == 'deal') {
                    const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0, qty = ((res.total / 100) * this.opt.relative_quantity) / this.opt.limit;
                    this.opt.quantity = floorTo(qty, qtyN);
                    this.isSetNewOrderProcess = false;
                    if (this.opt.stop_loss_is_trailing == 'true') {
                        userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
                            callback();
                        });
                    }
                    else {
                        order(this.userId, this.opt, () => { }, true);
                    }
                }
                else if (this.opt.relative_quantity_of == 'balance') {
                    const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0;
                    let f;
                    (f = () => {
                        if (this.secondBalance !== null) {
                            const balance = this.secondBalance;
                            this.secondBalance = null;
                            const qty = ((balance / 100) * this.opt.relative_quantity) / this.opt.limit;
                            this.opt.quantity = floorTo(qty, qtyN);
                            this.isSetNewOrderProcess = false;
                            if (this.opt.stop_loss_is_trailing == 'true') {
                                userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
                                    callback();
                                });
                            }
                            else {
                                order(this.userId, this.opt, () => { }, true);
                            }
                        }
                        else {
                            setImmediate(f);
                        }
                    })();
                }
            }
        }
    }
    // if (res.side == 'BUY') {
    // 	if (
    // 		res.executionType == 'TRADE' &&
    // 		res.orderStatus == 'FILLED' &&
    // 		(
    // 			this.opt.condition == 'last-buy-filled-balance-updated' ||
    // 			this.opt.condition == 'last-buy-filled'
    // 		)
    // 	) {
    // 		if (this.opt.price_is_auto == 'true') {
    // 			switch (this.opt.price_formula) {
    // 				case 'buy-price-plus-profit':
    // 					this.opt.price = ((res.price / 100) * this.opt.auto_price_profit) + res.price;
    // 					break;
    // 				default:
    // 					break;
    // 			}
    // 		}
    // 		if (this.opt.stop_limit_is_auto == 'true') {
    // 			let stop, limit;
    // 			switch (this.opt.stop_limit_formula) {
    // 				case 'buy-price-minus-loss':
    // 					stop = res.price - ((res.price / 100) * this.opt.auto_stop_loss);
    // 					limit = stop - this.opt.auto_limit_loss;
    // 					break;
    // 				case 'relative-buy-price':
    // 					if (this.opt.type == 'STOP-LOSS') {
    // 						stop = res.price - ((res.price / 100) * this.opt.auto_stop_perc);
    // 						limit = stop - this.opt.auto_stop_to_limit;
    // 					} else {
    // 						stop = res.price + ((res.price / 100) * this.opt.auto_stop_perc);
    // 						limit = stop + this.opt.auto_stop_to_limit;
    // 					}
    // 					break;
    // 			}
    // 			this.opt.stop = stop;
    // 			this.opt.limit = limit;
    // 		}
    // 		if (this.opt.relative_quantity_of == 'deal') {
    // 			const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0,
    // 				qty = (res.quantity / 100) * this.opt.relative_quantity;
    // 			this.opt.quantity = floorTo(qty, qtyN);
    // 			if (this.opt.stop_loss_is_trailing == 'true') {
    // 				userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
    // 					callback();
    // 				});
    // 			} else {
    // 				order(this.userId, this.opt, () => { }, true);
    // 			}
    // 		} else if (this.opt.relative_quantity_of == 'balance') {
    // 			const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0;
    // 			let f;
    // 			(f = () => {
    // 				if (this.secondBalance !== null) {
    // 					const balance = this.secondBalance;
    // 					this.secondBalance = null;
    // 					const qty = ((balance / 100) * this.opt.relative_quantity) / this.opt.limit;
    // 					this.opt.quantity = floorTo(qty, qtyN);
    // 					console.log('opt buy balance -' + balance, this.opt);
    // 					if (this.opt.stop_loss_is_trailing == 'true') {
    // 						userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
    // 							callback();
    // 						});
    // 					} else {
    // 						order(this.userId, this.opt, () => { }, true);
    // 					}
    // 				} else {
    // 					setImmediate(f);
    // 				}
    // 			})();
    // 		}
    // 	}
    // } else if (res.side == 'SELL') {
    // 	if (
    // 		res.executionType == 'TRADE' &&
    // 		res.orderStatus == 'FILLED' &&
    // 		(
    // 			this.opt.condition == 'last-sell-filled-balance-updated' ||
    // 			this.opt.condition == 'last-sell-filled'
    // 		)
    // 	) {
    // 		if (this.opt.stop_limit_is_auto == 'true') {
    // 			let stop, limit;
    // 			switch (this.opt.stop_limit_formula) {
    // 				case 'relative-sell-price':
    // 					if (this.opt.type == 'STOP-LOSS') {
    // 						stop = res.price + ((res.price / 100) * this.opt.auto_stop_perc);
    // 						limit = stop + this.opt.auto_stop_to_limit;
    // 					} else {
    // 						// stop = res.price + ((res.price / 100) * this.opt.auto_stop_perc);
    // 						// limit = stop + this.opt.auto_stop_to_limit;
    // 					}
    // 					break;
    // 			}
    // 			this.opt.stop = stop;
    // 			this.opt.limit = limit;
    // 		}
    // 		if (this.opt.relative_quantity_of == 'deal') {
    // 			const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0,
    // 				qty = (res.quantity / 100) * this.opt.relative_quantity;
    // 			this.opt.quantity = floorTo(qty, qtyN);
    // 			if (this.opt.stop_loss_is_trailing == 'true') {
    // 				userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
    // 					callback();
    // 				});
    // 			} else {
    // 				order(this.userId, this.opt, () => { }, true);
    // 			}
    // 		} else if (this.opt.relative_quantity_of == 'balance') {
    // 			const qtyN = (this.opt.qty_step.includes('.')) ? this.opt.qty_step.split('.')[1].length : 0;
    // 			let f;
    // 			(f = () => {
    // 				if (this.firstBalance !== null) {
    // 					const balance = this.firstBalance;
    // 					this.firstBalance = null;
    // 					const qty = (balance / 100) * this.opt.relative_quantity;
    // 					this.opt.quantity = floorTo(qty, qtyN);
    // 					console.log('opt sell balance -' + balance, this.opt);
    // 					if (this.opt.stop_loss_is_trailing == 'true') {
    // 						userTasks[this.userId].newTralingTask(this.userId, this.opt, () => {
    // 							callback();
    // 						});
    // 					} else {
    // 						order(this.userId, this.opt, () => { }, true);
    // 					}
    // 				} else {
    // 					setImmediate(f);
    // 				}
    // 			})();
    // 		}
    // 	}
    // }
};
// user tasks
function UserTask() {
    this.conditionTasks = {};
    this.tralingTasks = {};
    this.newConditionTask = function (userId, opt) {
        const taskId = '-' + opt.symbol + '-' + opt.side;
        if (this.conditionTasks[taskId] === undefined) {
            this.conditionTasks[taskId] = new ConditionTask(userId, opt);
        }
    };
    this.newTralingTask = function (userId, opt, callback) {
        const taskId = '-' + opt.symbol + '-' + opt.side;
        if (this.tralingTasks[taskId] === undefined) {
            this.tralingTasks[taskId] = new TralingTask(userId, opt, callback, taskId);
        }
    };
    this.callConditionTask = function (ev, res) {
        if (ev == 'ordersUpdate') {
            for (const key in this.conditionTasks) {
                const task = this.conditionTasks[key];
                if (key.includes('-' + res.symbol + '-') && this.conditionTasks.hasOwnProperty(key)) {
                    task.setNewOrder(res, () => {
                        // delete this.conditionTasks[key];
                    });
                }
            }
        }
        else if (ev == 'balanceUpdate') {
            for (const key in this.conditionTasks) {
                const task = this.conditionTasks[key];
                if (task.isSetNewOrderProcess) {
                    for (const symbolKey in res) {
                        if (res.hasOwnProperty(symbolKey)) {
                            if (symbolKey == task.opt.first_symbol) {
                                task.firstBalance = res[task.opt.first_symbol].available;
                            }
                            else if (symbolKey == task.opt.second_symbol) {
                                task.secondBalance = res[task.opt.second_symbol].available;
                            }
                        }
                    }
                }
            }
        }
    };
    this.callTralingTask = function (ev, res) {
        if (ev == 'symbolsChange') {
            for (const key in this.tralingTasks) {
                if (key.includes('-' + res.symbol + '-') && this.tralingTasks.hasOwnProperty(key)) {
                    this.tralingTasks[key].trailOrder(res);
                }
            }
        }
        else {
            for (const key in this.tralingTasks) {
                if (key.includes('-' + res.symbol + '-' + res.side) &&
                    this.tralingTasks.hasOwnProperty(key)) {
                    if (res.orderId == this.tralingTasks[key].orderId &&
                        ((res.executionType == 'TRADE' && res.orderStatus == 'FILLED') || (res.executionType == 'CANCELED' && !this.tralingTasks[key].processCancel))) {
                        delete this.tralingTasks[key];
                    }
                }
            }
        }
    };
}
// math func
function floorTo(x, n) {
    const m = Math.pow(10, n);
    return Math.floor(x * m) / m;
}
// task factory
const factory = function (userId, opt, callback) {
    if (!opt)
        return userTasks[userId];
    // user task isset
    if (userTasks[userId] !== undefined) {
        if (opt.conditional == 'true') {
            userTasks[userId].newConditionTask(userId, opt);
            callback();
        }
        else {
            userTasks[userId].newTralingTask(userId, opt, callback);
        }
        return userTasks[userId];
    }
    // new user task
    userTasks[userId] = new UserTask();
    if (opt.conditional == 'true') {
        userTasks[userId].newConditionTask(userId, opt);
        callback();
    }
    else {
        userTasks[userId].newTralingTask(userId, opt, callback);
    }
    // bind events
    chart.ev.on('wsSymbolsChange24', function (res) {
        userTasks[userId].callTralingTask('symbolsChange', res);
    });
    user(userId).ev.on('ordersUpd', function (res) {
        userTasks[userId].callTralingTask('ordersUpdate', res);
        userTasks[userId].callConditionTask('ordersUpdate', res);
    });
    user(userId).ev.on('balanceUpd', function (res) {
        userTasks[userId].callConditionTask('balanceUpdate', res);
    });
    return userTasks[userId];
};
module.exports = factory;
//# sourceMappingURL=watch.js.map