'use strict';

const res = 100 - (100 / (1 + ((((47069 - 46973) + (47243 - 47060)) / 3) / ((47243 - 46973) / 3))));

console.log(res);

// const Binance = require('node-binance-api'),
// 	request = require('request');

// const bin1 = new Binance().options({
// 	APIKEY: 'WY1mPnVjBWnPU58u6FG0gaK7l4lxSf95bhawDTnkPJql5bcMNJWZ3S00RUHfAtkp',
// 	APISECRET: 'ttuby0O54qzDA9aDylmBMG6TtIIJ5r0rQOMlmq1OHsVSCsECo31JGyxGDh6SyWRa',
// 	useServerTime: true // If you get timestamp errors, synchronize to server time at startup
// });

// const bin2 = new Binance().options({
// 	APIKEY: 'JABNMO3WMhlZV9HiRfiuKaFEMaNkSlrmq98ssyamd6lqnizAD38xoNRNcgFnCvUW',
// 	APISECRET: 'bao8Nuz10fBcWCx68wK9PMGS4rq2uaESmHdSUsZJdnrSKv698G1rkZ2m4djvBQ0n',
// 	useServerTime: true // If you get timestamp errors, synchronize to server time at startup
// });

// const bin0 = new Binance();

// bin0.exchangeInfo(function(er, response) {
// 	console.log(response.rateLimits);
// });

// bin1.exchangeInfo(function(er, response) {
// 	console.log(response.rateLimits);
// });

// bin1.balance((error, balances) => {
// 	// if ( error ) return console.error(error);
// 	console.log("balances()", balances);
//  });

// 	events = require('events');

// let ev1 = new events.EventEmitter();


// var quantity = 6.40,
// stopPrice = 2.6400,
// price = 2.6400;
// // STOP_LOSS_LIMIT
// // TAKE_PROFIT_LIMIT
// bin1.buy("LINKUSDT", quantity, price, {stopPrice: stopPrice, type:'TAKE_PROFIT_LIMIT'}, (error, response) => {
//   if (error) {
//      return console.log(error.body);
//   }
//   console.log(response);
// });

// bin1.marketSell("LINKUSDT", 35, (error, response) => {
//   console.log(error.body, response);
// });

// bin1.openOrders("LINKUSDT", (error, openOrders, symbol) => {
//   console.log("openOrders("+symbol+")", openOrders);
// });

// bin1.cancel("LINKUSDT", 72160332, (error, response, symbol) => {
//   console.log(symbol+" cancel response:", response);
// });

// bin0.websockets.prevDay(false, (err, res) => {
// 	if ('COCOSUSDTsell'.includes(res.symbol)) {
// 		console.log(res);
// 	}
// });

// const balanceUpdate = (data) => {
// 	const res = {};

// 	for (let obj of data.B) {
// 		let { a: symbol, f: available, l: onOrder } = obj;

// 		if (available != '0.00000000') {
// 			console.log(obj);
// 		}
// 	}

// }

// const executionUpdate = (data) => {
// 	console.log(data);
// }

// bin1.websockets.userData(balanceUpdate, executionUpdate);

// const url = 'https://api.telegram.org/bot896852707:AAG4rMma_6rTX36z_ZHbuRA6zvX1q9rkmxI/',
// 	method = 'sendMessage',
// 	opt = {
// 		json: {
// 			chat_id: 771235330,
// 			text: 'Privet medved'
// 		}
// 	}

// request.post(url + method, opt, function (err, res, data) {
// 	if (err) {
// 		console.log(err);
// 	} else {
// 		console.log(data);
// 	}
// });

// bin0.candlesticks(["BNBBTC", 'BTCUSDT'], "5m", (error, ticks, symbol) => {
// 	console.log("candlesticks()", ticks);
	
//  }, {limit: 1});