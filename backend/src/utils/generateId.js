const crypto = require('crypto');

function generateId(prefix) {
    return `${prefix}_${crypto.randomUUID()}`;
}

module.exports = generateId;