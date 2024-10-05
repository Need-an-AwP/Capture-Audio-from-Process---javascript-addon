const fs = require('fs');
const path = require('path');

const bindingGyp = path.join(__dirname, '..', 'binding.gyp');
const bindingGypBackup = path.join(__dirname, '..', '_binding.gyp');

if (fs.existsSync(bindingGyp)) {
    fs.renameSync(bindingGyp, bindingGypBackup);
}