import Binance from 'node-binance-api';
import { BINANCE_KEY, BINANCE_SECRET } from '../config';
import { TradesList, TradesListStream } from './TradesList'

const binance: Binance = new Binance().options({
    APIKEY: BINANCE_KEY,
    APISECRET: BINANCE_SECRET,
    useServerTime: true
});

const streamApi = 'wss://fstream.binance.com/stream?streams=';

export { streamApi, binance, TradesList, TradesListStream };