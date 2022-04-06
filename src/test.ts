import { priceStream } from './binanceApi';

const arr = ['a','b','c'];

console.log(arr.slice(-2));

const eksemps = {};

class TestCl { 
    someProp = 'lalalal';

    priceStreamHandler(arg) {
        console.log('Prices');
        console.log(arg);
        console.log('THIS');
        console.log(this.someProp);
    }

    getPrice() {
        priceStream('BTCUSDT', arg => {
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