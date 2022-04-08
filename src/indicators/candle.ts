import { Candle } from './types';

export default function (cdl: Candle, pos: 'long' | 'short'): 'stopLong' | 'stopShort' | 'stopBoth' {
    if (cdl.close > cdl.open) {
        // UP CANDLE
        const highTail = cdl.high - cdl.close;
        const body = cdl.close - cdl.open;
        const lowTail = cdl.open - cdl.low;

        /* if (body < lowTail && body < highTail) {
            return 'stopBoth';
        } else */ if (pos == 'long' && highTail / (body + lowTail) > .33) {
            return 'stopLong';
        } else if (pos == 'short' && lowTail / (body + highTail) > .33) {
            return 'stopShort';
        }

    } else if (cdl.close < cdl.open) {
        // DOWN CANDLE
        const highTail = cdl.high - cdl.open;
        const body = cdl.open - cdl.close;
        const lowTail = cdl.close - cdl.low;

        /* if (body < lowTail && body < highTail) {
            return 'stopBoth';
        } else */ if (pos == 'short' && lowTail / (body + highTail) > .33) {
            return 'stopShort';
        } else if (pos == 'long' && highTail / (body + lowTail) > .33) {
            return 'stopLong';
        }
    }
}