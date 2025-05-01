import { WebSocketServer, WebSocket } from "ws";
import http from "http";

// Tạo HTTP server (bắt buộc để giữ tiến trình sống trên Render)
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("WebSocket Server is running\n");
});

// Lấy port từ Render hoặc mặc định là 4000 khi chạy local
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;

const wss = new WebSocketServer({ server });

wss.on("connection", (ws: WebSocket) => {
  console.log("✅ WebSocket connected");

  ws.on("message", (message: WebSocket.RawData) => {
    console.log("📩 Message received:", message.toString());

    // Gửi message cho tất cả client khác
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
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
