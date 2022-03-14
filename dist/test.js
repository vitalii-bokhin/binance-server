'use strict';
const Binance = require('node-binance-api'), request = require('request');
const bin1 = new Binance().options({
    APIKEY: 'WY1mPnVjBWnPU58u6FG0gaK7l4lxSf95bhawDTnkPJql5bcMNJWZ3S00RUHfAtkp',
    APISECRET: 'ttuby0O54qzDA9aDylmBMG6TtIIJ5r0rQOMlmq1OHsVSCsECo31JGyxGDh6SyWRa',
    useServerTime: true // If you get timestamp errors, synchronize to server time at startup
});
const bin2 = new Binance().options({
    APIKEY: 'JABNMO3WMhlZV9HiRfiuKaFEMaNkSlrmq98ssyamd6lqnizAD38xoNRNcgFnCvUW',
    APISECRET: 'bao8Nuz10fBcWCx68wK9PMGS4rq2uaESmHdSUsZJdnrSKv698G1rkZ2m4djvBQ0n',
    useServerTime: true // If you get timestamp errors, synchronize to server time at startup
});
const bin0 = new Binance();
bin0.exchangeInfo(function (er, response) {
    console.log(response.rateLimits);
});
bin1.exchangeInfo(function (er, response) {
    console.log(response.rateLimits);
});
//# sourceMappingURL=test.js.map