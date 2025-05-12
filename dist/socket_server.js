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
// Lấy port từ Render hoặc mặc định là 4000
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const wss = new ws_1.WebSocketServer({ server });
const clients = new Map();
wss.on("connection", (ws) => {
    console.log("✅ WebSocket connected");
    let clientId = null;
    ws.on("message", (data) => {
        try {
            const msg = JSON.parse(data.toString());
            // Bước 1: Đăng ký client
            if (!clientId && msg.command === "registry" && msg.name) {
                clientId = msg.name;
                clients.set(msg.name, ws); // dùng msg.name vì đã đảm bảo là string
                console.log(`✅ Registered client: ${clientId}`);
                return;
            }
            // Nếu chưa đăng ký thì không xử lý tiếp
            if (!clientId) {
                console.warn("⚠️ Message từ client chưa đăng ký bị từ chối");
                return;
            }
            // Bước 2: Gửi message tới client cụ thể (theo msg.to)
            if (msg.to) {
                const targetClient = clients.get(msg.to);
                if (targetClient && targetClient.readyState === ws_1.WebSocket.OPEN) {
                    targetClient.send(JSON.stringify(msg));
                    console.log(`📨 Message from ${clientId} sent to ${msg.to}`);
                }
                else {
                    console.warn(`⚠️ Client '${msg.to}' not connected`);
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
            clients.delete(clientId);
            console.log(`❌ Client ${clientId} disconnected`);
        }
    });
});
server.listen(PORT, () => {
    console.log(`🚀 WebSocket server is running on port ${PORT}`);
});
