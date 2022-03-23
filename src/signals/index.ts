import { Result, SignalEntry } from './types';
import { Aisle } from './aisle';
import { Fling } from './fling';

export { Aisle, Fling };

export async function Signals({ fee, limit, data }: SignalEntry) {
    const aisle = await Aisle({ fee, limit, data });
    const fling = await Fling({ fee, limit, data });

    const signals: Result = [].concat(aisle, fling);

    signals.sort((a, b) => b.expectedProfit - a.expectedProfit);

    return signals;
}