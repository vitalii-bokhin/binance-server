"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_ws_1 = __importDefault(require("express-ws"));
const express_session_1 = __importDefault(require("express-session"));
const body_parser_1 = __importDefault(require("body-parser"));
// import http from 'http';
// import lodashExpress from 'lodash-express';
const multer_1 = __importDefault(require("multer"));
// import websocket from 'ws';
const api_1 = __importDefault(require("./api"));
const bot_1 = require("../bot");
const db = require('../database'), user = require('../user'), watch = require('../watch'), order = require('../order');
const upload = (0, multer_1.default)();
const { app } = (0, express_ws_1.default)((0, express_1.default)());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(body_parser_1.default.json());
// session
const sessionParser = (0, express_session_1.default)({
    saveUninitialized: false,
    secret: 'GyHltUf$swN21Cx',
    resave: false
});
app.use(sessionParser);
// view template
// lodashExpress(app, 'html');
// app.set('views', './templates');
// app.set('view engine', 'html');
// app.use('./templates/static', express.static('./templates/static'));
// post  
app.use(express_1.default.urlencoded({ extended: true }));
// create server
// const server = http.createServer(app);
// wss = new websocket.Server({ noServer: true });
// ws
// const expressWs = websocket(app);
app.ws('/echo', function (ws, req) {
    console.log('dsasdsad');
    ws.on('message', function (msg) {
        ws.send(msg);
    });
});
// api
const api = express_1.default.Router();
app.use('/api', (0, api_1.default)(api));
// queries
app.get('/', function (req, res) {
    // const opt = {
    //     title: 'This is Home page',
    //     userName: req.session.userEmail
    // };
    // res.render('index', opt);
    res.json({ key: "Halllow worrldd" });
});
app.get('/bot', async (req, res) => {
    await (0, bot_1.Bot)();
    const query = {};
    for (const key in req.query) {
        if (Object.prototype.hasOwnProperty.call(req.query, key)) {
            query[key] = (req.query[key] === 'false') ? false : req.query[key];
        }
    }
    const { resolvePositionMaking, tradingSymbols } = await (0, bot_1.BotControl)(query);
    res.json({ status: 'Bot started!', resolvePositionMaking, tradingSymbols });
});
app.get('/test', function (req, res) {
    res.json({ key: "Halllow worrldd" });
});
app.post('/auth', upload.none(), function (req, res) {
    const user = db.user(null, req.body.email);
    if (user && user.pass == req.body.pass) {
        req.session.userId = user.id;
        req.session.userEmail = user.email;
        res.json({ status: 'logged' });
    }
    else {
        res.json({ status: 'error', error_txt: 'Пользователя не существует' });
    }
});
app.get('/exchange-info', function (req, res) {
    // Chart.exchangeInfo(function (data) {
    //     res.json(data);
    // });
});
app.get('/candlesticks', function (req, res) {
    const { symbols, interval, limit } = req.query;
    // Chart.candlesticks({ symbols, interval, limit }, function (data) {
    //     res.json(data);
    // });
});
app.post('/symbols-change-24', function (req, res) {
    const symbols = req.body.symbols || false;
    // Chart.symbolsChange24(symbols, function (data) {
    //     res.json(data);
    // });
});
app.post('/balance', function (req, res) {
    if (req.session.userId) {
        (function f() {
            user(req.session.userId).bin.balance((error, balances) => {
                if (error) {
                    f();
                    return;
                }
                res.json(balances);
            });
        })();
    }
    else {
        res.send(null);
    }
});
app.post('/tasks', function (req, res) {
    if (req.session.userId) {
        res.json(watch(req.session.userId));
    }
});
app.post('/trades', function (req, res) {
    if (req.session.userId) {
        user(req.session.userId).bin.trades(req.body.symbols, (error, trades, symbol) => {
            res.json(trades);
        });
    }
    else {
        res.send(null);
    }
});
app.delete('/logout', function (request, response) {
    request.session.destroy(function () {
        response.send({ result: 'OK', message: 'Session destroyed' });
    });
});
app.get('/orders', function (req, res) {
    user(1).bin.mgOpenOrders(req.query.symbol, (error, openOrders, symbol) => {
        res.json(openOrders);
    });
});
app.post('/order', function (req, res) {
    const opt = {
        symbol: req.body.symbol,
        side: req.body.side.toUpperCase(),
        stop: +req.body.stop,
        limit: +req.body.limit,
        quantity: +req.body.quantity
    };
    order(1, opt, function (data) {
        res.json(data);
    });
});
// app.post('/order', upload.none(), function (req, res) {
// 	if (req.session.userId) {
// 		const opt = {
// 			symbol: req.body.order_symbols.toUpperCase(),
// 			first_symbol: req.body.first_symbol.toUpperCase(),
// 			second_symbol: req.body.second_symbol.toUpperCase(),
// 			type: req.body.order_type.toUpperCase(),
// 			quantity: +req.body.quantity,
// 			side: req.body.order_side.toUpperCase(),
// 			price: +req.body.price,
// 			stop: +req.body.stop_price,
// 			limit: +req.body.limit_price,
// 			conditional: req.body.conditional,
// 			condition: req.body.condition,
// 			price_is_auto: req.body.price_is_auto,
// 			price_formula: req.body.price_formula,
// 			auto_price_profit: +req.body.auto_price_profit,
// 			stop_limit_is_auto: req.body.stop_limit_is_auto,
// 			stop_limit_formula: req.body.stop_limit_formula,
// 			auto_stop_loss: +req.body.auto_stop_loss,
// 			auto_limit_loss: +req.body.auto_limit_loss,
// 			relative_quantity: +req.body.relative_quantity,
// 			relative_quantity_of: req.body.relative_quantity_of,
// 			auto_stop_perc: +req.body.auto_stop_perc,
// 			auto_stop_to_limit: +req.body.auto_stop_to_limit,
// 			price_step: req.body.price_step,
// 			qty_step: req.body.qty_step,
// 			stop_loss_is_trailing: req.body.stop_loss_is_trailing,
// 			stop_loss_trailing_distance: +req.body.stop_loss_trailing_distance,
// 			stop_loss_trailing_distance_if: +req.body.stop_loss_trailing_distance_if,
// 			stop_loss_trailing_distance_2: +req.body.stop_loss_trailing_distance_2,
// 			buyPrice: null
// 		};
// 		if (opt.conditional == 'true' || opt.stop_loss_is_trailing == 'true') {
// 			if (opt.conditional == 'true') {
// 				watch(req.session.userId, opt, function () {
// 					res.json({
// 						status: 'success',
// 						tasks: watch(req.session.userId)
// 					});
// 				});
// 			} else {
// 				watch(req.session.userId, opt, function (obj) {
// 					res.json(obj);
// 				});
// 			}
// 		} else {
// 			order(req.session.userId, opt, function (obj) {
// 				res.json(obj);
// 			});
// 		}
// 	} else {
// 		res.json({ status: 'user_undefined' });
// 	}
// });
// session in websocket
// server.on('upgrade', function (request, socket, head) {
//     sessionParser(request, {}, function () {
//         wss.handleUpgrade(request, socket, head, function (ws) {
//             wss.emit('connection', ws, request);
//         });
//     });
// });
// websocket
// let isWsConnected = false;
// wss.on('connection', function (ws, req) {
//     function balUpd(res) {
//         ws.send(JSON.stringify({ kind: 'balanceUpd', data: res }));
//     }
//     function ordUpd(res) {
//         ws.send(JSON.stringify({ kind: 'ordersUpd', data: res }));
//     }
//     if (req.session.userId) {
//         ws.id = req.session.userId;
//         user(ws.id).ev.on('balanceUpd', balUpd);
//         user(ws.id).ev.on('ordersUpd', ordUpd);
//     }
//     ws.on('message', function (message) {
//         ws.symbolsArr = JSON.parse(message);
//     });
//     if (!isWsConnected) {
//         isWsConnected = true;
//         Chart.ev.on('wsSymbolsChange24', symbolsChange24);
//         // chart.wsCandlesTicks();
//         // chart.ev.on('wsSymbolsChange24', symbolsChange24);
//     }
//     // websocket closed
//     ws.on('close', function () {
//         if (ws.id) {
//             user(ws.id).ev.off('balanceUpd', balUpd);
//             user(ws.id).ev.off('ordersUpd', ordUpd);
//         }
//         if (!wss.clients.size) {
//             Chart.ev.off('wsSymbolsChange24', symbolsChange24);
//             isWsConnected = false;
//         }
//         // if (ws.id) {
//         // 	user(ws.id).websockets.terminate(ws.endpoint);
//         // }
//     });
// });
// function symbolsChange24(res) {
//     wss.clients.forEach(function (client) {
//         if (client.symbolsArr && client.symbolsArr.includes(res.symbol)) {
//             client.send(JSON.stringify({ kind: 'symbolsChange24', data: res }));
//         }
//     });
// }
// function wssSendAll(data) {
//     wss.clients.forEach(function (client) {
//         client.send(data);
//     });
//     return wss.clients.size;
// }
// start server
app.listen(3000, () => {
    console.log('Listening on port 3000');
});
//# sourceMappingURL=index.js.map