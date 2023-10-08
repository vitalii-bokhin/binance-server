"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveData = exports.GetData = void 0;
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
function GetData(filename) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let data = yield fs_1.promises.readFile(path_1.default.dirname(__dirname) + '/db/' + filename + '.json', 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
        }
    });
}
exports.GetData = GetData;
function SaveData(filename, data) {
    return fs_1.promises.writeFile(path_1.default.dirname(__dirname) + '/db/' + filename + '.json', JSON.stringify(data), { flag: 'w' });
}
exports.SaveData = SaveData;
//# sourceMappingURL=index.js.map