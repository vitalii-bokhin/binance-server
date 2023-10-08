"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsEvent = void 0;
const ws_1 = require("ws");
const events_1 = require("events");
const positions_1 = require("../positions");
class MyEmitter extends events_1.EventEmitter {
}
exports.wsEvent = new MyEmitter();
const wss = new ws_1.WebSocketServer({
    port: 3001,
    perMessageDeflate: {
        zlibDeflateOptions: {
            // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true,
        serverNoContextTakeover: true,
        serverMaxWindowBits: 10,
        // Below options specified as default values.
        concurrencyLimit: 10,
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed if context takeover is disabled.
    },
});
wss.on('connection', (ws, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        ws.send('connected', { binary: false });
        ws.on('message', (msg) => __awaiter(void 0, void 0, void 0, function* () {
            ws.send('connected', { binary: false });
        }));
        exports.wsEvent.on('send', () => {
            try {
                const positions = [];
                positions_1.openedPositions.forEach((item) => {
                    positions.push({
                        symbol: item.symbol,
                        entryPrice: item.entryPrice,
                        stopLoss: item.stopLoss,
                        takeProfit: item.takeProfit,
                    });
                });
                ws.send(JSON.stringify(positions), { binary: false });
            }
            catch (error) {
                console.error(error);
            }
        });
        ws.on('error', (err) => console.error(err));
    }
    catch (error) {
        console.error(error);
        ws.close();
    }
}));
//# sourceMappingURL=wss.js.map