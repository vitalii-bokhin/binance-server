import { promises as fs } from 'fs';
import path from 'path';

export type Tradelines = {
    id: string;
    symbol: string;
    type: 'trends' | 'levels';
    lines?: {
        start: {
            price: number;
            time: number;
        };
        end: {
            price: number;
            time: number;
        };
    }[];
    price?: number[];
}[];

export async function GetData<ReturnT>(filename: string): Promise<ReturnT | undefined> {
    try {
        const data = await fs.readFile(path.dirname(__dirname) + '/db/' + filename + '.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        /* empty */
    }
}

export function SaveData(filename: string, data: any) {
    return fs.writeFile(path.dirname(__dirname) + '/db/' + filename + '.json', JSON.stringify(data), { flag: 'w' });
}
