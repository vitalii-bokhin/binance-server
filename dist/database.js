'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const users = {
    1: {
        id: 1,
        email: 'l21@gmail.com',
        pass: '21',
        api_key: 'WY1mPnVjBWnPU58u6FG0gaK7l4lxSf95bhawDTnkPJql5bcMNJWZ3S00RUHfAtkp',
        api_secret: 'ttuby0O54qzDA9aDylmBMG6TtIIJ5r0rQOMlmq1OHsVSCsECo31JGyxGDh6SyWRa'
    }
};
const getUser = function (id, email) {
    if (email) {
        for (const key in users) {
            const el = users[key];
            if (el.email == email) {
                id = el.id;
            }
        }
    }
    return users[id];
};
module.exports.user = getUser;
//# sourceMappingURL=database.js.map