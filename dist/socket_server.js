"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
// Tạo HTTP server
const server = http_1.default.createServer((req, res) => {
    res.writeHead(200);
    res.end("WebSocket Server is running\n");
});
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const wss = new ws_1.WebSocketServer({ server });
// Map<string, WebSocket[]> để hỗ trợ nhiều client có cùng name
const clients = new Map();
wss.on("connection", (ws) => {
    console.log("✅ WebSocket connected");
    let clientId = null;
    let registered = false;
    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());
            // Đăng ký client - chỉ cho phép 1 lần
            if (!registered && msg.command === "registry" && msg.name) {
                clientId = msg.name;
                const list = clients.get(msg.name) || [];
                list.push(ws);
                clients.set(msg.name, list);
                registered = true;
                console.log(`✅ Registered client: ${clientId}`);
                return;
            }
            if (!registered) {
                console.warn("⚠️ Message từ client chưa đăng ký bị từ chối");
                return;
            }
            // Gửi message tới tất cả clients có name = msg.to
            if (msg.to) {
                const targetClients = clients.get(msg.to);
                if (targetClients && targetClients.length > 0) {
                    targetClients.forEach(client => {
                        if (client.readyState === ws_1.WebSocket.OPEN) {
                            client.send(JSON.stringify(msg));
                        }
                    });
                    console.log(`📨 Message from ${clientId} sent to all '${msg.to}' clients`);
                }
                else {
                    console.warn(`⚠️ No connected clients for '${msg.to}'`);
                }
            }
            else {
                console.warn("⚠️ Message không có trường 'to', bỏ qua");
            }
        }
        catch (err) {
            console.error("❗ Invalid message format:", err);
        }
    });
    ws.on("close", () => {
        if (clientId) {
            const list = clients.get(clientId);
            if (list) {
                const filtered = list.filter(client => client !== ws);
                if (filtered.length > 0) {
                    clients.set(clientId, filtered);
                }
                else {
                    clients.delete(clientId);
                }
                console.log(`❌ Client ${clientId} disconnected`);
            }
        }
    });
});
server.listen(PORT, () => {
    console.log(`🚀 WebSocket server is running on port ${PORT}`);
});
