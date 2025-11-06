import type { WebSockets } from "sappsjs/types";
import { queryToken } from "@/middleware/query-token";

export const websockets: WebSockets = {
  "/ws/chats": [[queryToken], {
    async open(ws) {
      ws.send("Hola");
    },
    async message(ws, message) {
      ws.send(`Echo: ${message}`);
    },
  }],
  "/ws/chats2": {
    async open(ws) {
      ws.send("Hola");
    },
    async message(ws, message) {
      ws.send(`Echo: ${message}`);
    },
  },
}
