"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = bodyParser;
function bodyParser(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => {
            chunks.push(chunk);
            if (Buffer.byteLength(Buffer.concat(chunks)) > 1e6) {
                req.connection.destroy();
                reject(new Error('Request body too large (>1MB)'));
            }
        });
        req.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            try {
                const parsed = req.headers['content-type'] === 'application/json' ?
                    JSON.parse(body) || ' ' : body;
                resolve(parsed);
            }
            catch (err) {
                reject(err);
            }
        });
    });
}
//# sourceMappingURL=bodyParser.js.map