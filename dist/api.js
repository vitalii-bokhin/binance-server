"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const express = require("express");
const chart_1 = require("./chart");
const api = express.Router();
exports.api = api;
api.get('/candlesticks', (req, res) => {
    chart_1.Chart.candlesticks(req.query, function (data) {
        res.json(data);
    });
});
//# sourceMappingURL=api.js.map