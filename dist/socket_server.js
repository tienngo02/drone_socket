"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const http_1 = __importDefault(require("http"));
// Tạo HTTP server (bắt buộc để giữ tiến trình sống trên Render)
const server = http_1.default.createServer((req, res) => {
    res.writeHead(200);
    res.end("WebSocket Server is running\n");
});
// Lấy port từ Render hoặc mặc định là 4000 khi chạy local
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const wss = new ws_1.WebSocketServer({ server });
wss.on("connection", (ws) => {
    console.log("✅ WebSocket connected");
    ws.on("message", (message) => {
        console.log("📩 Message received:", message.toString());
        // Gửi message cho tất cả client khác
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });
    ws.on("close", () => {
        console.log("❌ Client disconnected");
    });
});
server.listen(PORT, () => {
    console.log(`🚀 WebSocket server is running on port ${PORT}`);
});
