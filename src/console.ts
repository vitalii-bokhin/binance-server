const output = {};

export function consoleLog(obj: {}) {
    console.clear();

    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            output[key] = obj[key];
        }
    }
    
    console.log(output);
}