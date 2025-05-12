import { WebSocketServer, WebSocket, RawData } from "ws";
import http, { IncomingMessage, ServerResponse } from "http";

// Tạo HTTP server
const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
  res.writeHead(200);
  res.end("WebSocket Server is running\n");
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000;
const wss = new WebSocketServer({ server });

// Map<string, WebSocket[]> để hỗ trợ nhiều client có cùng name
const clients = new Map<string, WebSocket[]>();

wss.on("connection", (ws: WebSocket) => {
  console.log("✅ WebSocket connected");

  let clientId: string | null = null;

  ws.on("message", (data: RawData) => {
    try {
      const msg = JSON.parse(data.toString());

      // Đăng ký client
      if (!clientId && msg.command === "registry" && msg.name) {
        clientId = msg.name;
        const list = clients.get(msg.name) || [];
        list.push(ws);
        clients.set(msg.name, list);
        console.log(`✅ Registered client: ${clientId}`);
        return;
      }

      if (!clientId) {
        console.warn("⚠️ Message từ client chưa đăng ký bị từ chối");
        return;
      }

      // Gửi message tới tất cả clients có name = msg.to
      if (msg.to) {
        const targetClients = clients.get(msg.to);
        if (targetClients && targetClients.length > 0) {
          targetClients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(msg));
            }
          });
          console.log(`📨 Message from ${clientId} sent to all '${msg.to}' clients`);
        } else {
          console.warn(`⚠️ No connected clients for '${msg.to}'`);
        }
      } else {
        console.warn("⚠️ Message không có trường 'to', bỏ qua");
      }

    } catch (err) {
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
        } else {
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
