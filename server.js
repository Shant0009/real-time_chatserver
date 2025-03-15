require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);  // ✅ Use HTTP server
const wss = new WebSocket.Server({ server });  // ✅ Attach WebSocket to server

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
    res.send("WebSocket server is running.");
});

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "connect-src 'self' ws://localhost:5000");
    next();
});

// Handle WebSocket connections
wss.on("connection", (ws) => {
    console.log("New client connected");

    ws.on("message", (message) => {
        console.log(`Received: ${message}`);
        ws.send(`Server received: ${message}`);
    });

    ws.on("close", () => {
        console.log("Client disconnected");
    });

    ws.onerror = (error) => {
        console.error("WebSocket Error:", error);
    };
    socket.send("Hello Again!");
    socket.send("Hello Again!");

    
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));  // ✅ Corrected
