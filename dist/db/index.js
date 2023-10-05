"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveData = exports.GetData = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
async function GetData(filename) {
    try {
        let data = await fs_1.promises.readFile(path_1.default.dirname(__dirname) + '/db/' + filename + '.json', 'utf-8');
        return JSON.parse(data);
    }
    catch (error) {
    }
}
exports.GetData = GetData;
function SaveData(filename, data) {
    return fs_1.promises.writeFile(path_1.default.dirname(__dirname) + '/db/' + filename + '.json', JSON.stringify(data), { flag: 'w' });
}
exports.SaveData = SaveData;
//# sourceMappingURL=index.js.map