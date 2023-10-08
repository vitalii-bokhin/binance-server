import { wsEvent } from '../server/wss';
import PositionEmulation from './PositionEmulation';

export const openedPositions = new Map<string, PositionEmulation>();

export function openPosition(props: { symbol: string; direction: 'long' | 'short'; entryPrice: number; stopLoss: number; }): void {

    if (openedPositions.has(props.symbol)) return;

    openedPositions.set(props.symbol, new PositionEmulation(props));

    openedPositions.get(props.symbol)
        .open()
        .then((symbol) => {
            openedPositions.delete(symbol);
            console.log('Close position - ' + symbol);
            wsEvent.emit('send');
        });
}
