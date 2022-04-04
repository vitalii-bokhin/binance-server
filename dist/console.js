"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleLog = void 0;
const output = {};
function consoleLog(obj) {
    console.clear();
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            output[key] = obj[key];
        }
    }
    console.log(output);
}
exports.consoleLog = consoleLog;
//# sourceMappingURL=console.js.map