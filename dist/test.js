let a = {
    ab: 'dasd',
    cd: 'dadasd',
    ef: 'asdasd'
};
for (const key in a) {
    if (Object.prototype.hasOwnProperty.call(a, key)) {
        const e = a[key];
        if (key == 'cd') {
            continue;
        }
        console.log(e);
    }
}
//# sourceMappingURL=test.js.map