"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const router_1 = require("./router");
const bodyParser_1 = __importDefault(require("../utils/bodyParser"));
const PORT = 3000;
const HOST = 'localhost';
const server = http_1.default.createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            req.body = await (0, bodyParser_1.default)(req);
        }
        catch (e) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: "Invalid JSON" }));
        }
    }
    if (req) {
        router_1.router.handle(req, res);
    }
    ;
});
server.listen(PORT, HOST, () => {
    console.log(`Server is running on http://${HOST}:${PORT}`);
});
//# sourceMappingURL=server.js.map