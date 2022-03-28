import { Result, SignalEntry } from './types';
import { Aisle } from './aisle';
import { Fling } from './fling';
import { Scalping } from './scalping';

export { Aisle, Fling };

export async function Signals({ fee, limit, data }: SignalEntry) {
    let signals: Result = [];

    try {
        // const aisle = await Aisle({ fee, limit, data });
        // const fling = await Fling({ fee, limit, data });
        const scalping = await Scalping({ fee, limit, data });

        signals = scalping;
        // const signals: Result = [].concat(aisle, fling);

        // signals.sort((a, b) => b.expectedProfit - a.expectedProfit);
        // signals.sort((a, b) => a.possibleLoss - b.possibleLoss);
        signals.sort((a, b) => b.preferIndex - a.preferIndex);

    } catch (error) {
        console.log(new Error(error));
    }

    return signals;
}