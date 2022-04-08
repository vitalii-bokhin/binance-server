'use strict';

const events = require('events'),
	Binance = require('node-binance-api'),
	db = require('./database');

const users = {};

function User(user) {
	this.ev = new events.EventEmitter();

	this.bin = new Binance().options({
		APIKEY: user.api_key,
		APISECRET: user.api_secret,
		// useServerTime: true
	});

	this.userData();
}

User.prototype.userData = function () {
	const balanceUpdate = (data) => {
		const res = {};

		for (let obj of data.B) {
			let { a: symbol, f: available, l: onOrder } = obj;

			if (available != '0.00000000') {
				res[symbol] = {
					available: +available,
					onOrder: +onOrder
				}
			}
		}

		this.ev.emit('balanceUpd', res);
	}

	const executionUpdate = (data) => {
		let { x: executionType, s: symbol, L: last_exec_price, q: quantity, S: side, o: orderType, i: orderId, X: orderStatus, Z: totalAmount } = data;

		const res = {
			symbol: symbol,
			side: side,
			price: +last_exec_price,
			quantity: +quantity,
			total: +totalAmount,
			executionType: executionType,
			orderStatus: orderStatus,
			orderId: orderId
		};

		if (orderStatus == "REJECTED") {
			console.log("Order Failed! Reason: " + data.r);
		}

		console.log(symbol + " " + side + " " + orderType + " ORDER #" + orderId + " (" + orderStatus + ")" + executionType);

		console.log("..price: " + last_exec_price + ", quantity: " + quantity);

		this.ev.emit('ordersUpd', res);
	}

	this.bin.websockets.userData(balanceUpdate, executionUpdate);
}

const factory = function (userId) {
	if (!userId) return;

	if (users[userId] === undefined) {

		const user = db.user(userId);

		users[userId] = new User(user);
	}

	return users[userId];
}

module.exports = factory;