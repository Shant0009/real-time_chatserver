require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const Message = require("./models/Message");

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

app.use("/api/messages", require("./routes/messageRoutes"));

// Store connected users
const users = new Map();

// Handle WebSocket connections
wss.on("connection", (ws, req) => {
    console.log("New WebSocket client connected");

    ws.on("message", async (message) => {
        const data = JSON.parse(message);

        if (data.type === "register") {
            users.set(data.userId, ws);
            console.log(`User ${data.userId} registered`);
        } else if (data.type === "private_message") {
            const { sender, receiver, content } = data;

            // Store message in MongoDB
            const newMessage = new Message({ sender, receiver, content });
            await newMessage.save();

            // Send message to the receiver if online
            if (users.has(receiver)) {
                users.get(receiver).send(JSON.stringify({ sender, content }));
            }
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        users.forEach((value, key) => {
            if (value === ws) {
                users.delete(key);
            }
        });
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));  // ✅ Corrected
