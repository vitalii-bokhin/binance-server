import WebSocket, { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { openedPositions } from '../positions';
import { OpenedPosition } from '../positions/types';

class MyEmitter extends EventEmitter { }

export const wsEvent = new MyEmitter();

const wss = new WebSocketServer({
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
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        serverMaxWindowBits: 10, // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10, // Limits zlib concurrency for perf.
        threshold: 1024 // Size (in bytes) below which messages
        // should not be compressed if context takeover is disabled.
    },
});

wss.on('connection', async (ws: WebSocket, req) => {
    try {
        ws.send('connected', { binary: false });

        ws.on('message', async (msg: any) => {
            ws.send('connected', { binary: false });
        });

        wsEvent.on('send', () => {
            try {
                const positions: OpenedPosition[] = [];

                openedPositions.forEach((item) => {
                    positions.push({
                        symbol: item.symbol,
                        entryPrice: item.entryPrice,
                        stopLoss: item.stopLoss,
                        takeProfit: item.takeProfit,
                    });
                });

                ws.send(JSON.stringify(positions), { binary: false });

            } catch (error) {
                console.error(error);
            }
        });

        ws.on('error', (err) => console.error(err));

    } catch (error) {
        console.error(error);
        ws.close();
    }
});
