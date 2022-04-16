import { promises as fs } from 'fs';
import path from 'path';

export async function GetData<ReturnT>(filename: string): Promise<ReturnT> {
    console.log('Read DATA');
    try {
        let data = await fs.readFile(path.dirname(__dirname) + '/db/' + filename + '.json', 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        
    }
}

export function SaveData(filename: string, data: any) {
    console.log('WRITe DATA');
    return fs.writeFile(
        path.dirname(__dirname) + '/db/' + filename + '.json',
        JSON.stringify(data),
        { flag: 'w' }
    );
}