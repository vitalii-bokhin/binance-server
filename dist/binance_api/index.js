"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradesListStream = exports.TradesList = exports.binance = exports.streamApi = void 0;
const node_binance_api_1 = __importDefault(require("node-binance-api"));
const config_1 = require("../config");
const TradesList_1 = require("./TradesList");
Object.defineProperty(exports, "TradesList", { enumerable: true, get: function () { return TradesList_1.TradesList; } });
Object.defineProperty(exports, "TradesListStream", { enumerable: true, get: function () { return TradesList_1.TradesListStream; } });
const binance = new node_binance_api_1.default().options({
    APIKEY: config_1.BINANCE_KEY,
    APISECRET: config_1.BINANCE_SECRET,
    useServerTime: true
});
exports.binance = binance;
const streamApi = 'wss://fstream.binance.com/stream?streams=';
exports.streamApi = streamApi;
//# sourceMappingURL=index.js.map