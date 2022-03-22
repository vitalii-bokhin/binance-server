import './client';
import { Bot } from './bot';
import { ordersUpdateStream, positionUpdateStream, priceStream } from './binanceApi';
import getSymbols from './symbols';
// import getSymbols from './symbols';


Bot();

// priceStream('IMXUSDT', function(res) {
//     console.log(res);
// });

// positionUpdateStream('IMXUSDT', function(res) {
//     console.log(res);
// });

// getSymbols().then(function(res) {
//     console.log(res.symbols);
//     console.log(res.symbolsObj);
// });


// require('./client');
// require('./bot');

// const chart = require('./chart');

// chart.wsSymbolsChange24();