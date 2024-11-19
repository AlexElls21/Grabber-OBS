const WebSocket = require("ws");

// Create a WebSocket server on port 8080
const wss = new WebSocket.Server({ port: 8080 });

// Broadcast a message to all connected clients
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send a welcome message or initial state to the new client
  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Connected to WebSocket server",
    })
  );

  // Handle incoming messages
  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      // Broadcast updates to all clients
      if (data.type === "update" || data.type === "move") {
        broadcast(data);
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  // Handle client disconnection
  ws.on("close", () => {
    console.log("Client disconnected");
  });

  // Handle errors
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Periodically ping clients to keep connections alive
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.ping();
    }
  });
}, 30000); // Ping every 30 seconds

console.log("WebSocket server running on ws://localhost:8080");
