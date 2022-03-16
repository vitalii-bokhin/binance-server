import express = require('express');
import {Chart} from './chart';


const api = express.Router();

api.get('/candlesticks', (req: { query: any; }, res: { json: (arg0: any) => void; }) => {
    Chart.candlesTicks(req.query, function (data: any) {
        res.json(data);
    });
});

export {api};