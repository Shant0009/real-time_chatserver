require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const Group = require("./models/Group");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.use("/api/groups", require("./routes/groupRoutes"));

// Store connected users & group members
const users = new Map();
const groups = new Map();
const onlineUsers = new Set();

// Handle WebSocket Connections
wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === "register") {
                users.set(data.userId, ws);
                ws.userId = data.userId;  // Store user ID on socket
                onlineUsers.add(data.userId);
                broadcastOnlineStatus();
            }
            else if (data.type === "join_group") {
                const { userId, groupId } = data;
                if (!groups.has(groupId)) {
                    groups.set(groupId, new Set());
                }
                groups.get(groupId).add(userId);
                
                // Notify group members that a new user joined
                broadcastToGroup(groupId, { type: "user_joined", userId });
            }
            else if (data.type === "group_message") {
                const { sender, groupId, content } = data;
                const group = await Group.findById(groupId);
                if (!group) return;

                const newMessage = { sender, content, timestamp: new Date() };
                group.messages.push(newMessage);
                await group.save();

                // Send message to group members
                broadcastToGroup(groupId, { type: "group_message", sender, content });
            }
            else if (data.type === "read_receipt") {
                // Mark messages as read
                broadcastToGroup(data.groupId, { type: "message_read", userId: data.userId });
            }
        } catch (error) {
            console.error("Error processing message:", error);
        }
    });

    ws.on("close", () => {
        console.log("Client disconnected");
        if (ws.userId) {
            users.delete(ws.userId);
            onlineUsers.delete(ws.userId);
            broadcastOnlineStatus();
        }
    });
});

// 📌 Broadcast Online Users
const broadcastOnlineStatus = () => {
    const onlineUsersArray = Array.from(onlineUsers);
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "online_users", users: onlineUsersArray }));
        }
    });
};

// 📌 Broadcast to Group Members
const broadcastToGroup = (groupId, message) => {
    if (groups.has(groupId)) {
        groups.get(groupId).forEach(memberId => {
            if (users.has(memberId)) {
                users.get(memberId).send(JSON.stringify(message));
            }
        });
    }
};

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));