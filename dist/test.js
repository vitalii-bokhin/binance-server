"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const binanceApi_1 = require("./binanceApi");
const arr = ['a', 'b', 'c'];
console.log(arr.slice(-2));
const eksemps = {};
class TestCl {
    constructor() {
        this.someProp = 'lalalal';
    }
    priceStreamHandler(arg) {
        console.log('Prices');
        console.log(arg);
        console.log('THIS');
        console.log(this.someProp);
    }
    getPrice() {
        (0, binanceApi_1.priceStream)('BTCUSDT', arg => {
            this.priceStreamHandler(arg);
        });
    }
}
eksemps['BTCUSDT'] = new TestCl();
eksemps['BTCUSDT'].getPrice();
setTimeout(function () {
    console.log(eksemps['BTCUSDT']);
    delete eksemps['BTCUSDT'];
    console.log(eksemps['BTCUSDT']);
}, 5000);
//# sourceMappingURL=test.js.map