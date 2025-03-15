const express = require("express");
const Message = require("../models/Message");
const router = express.Router();

// 📌 Send a private message
router.post("/send", async (req, res) => {
    try {
        const { sender, receiver, content } = req.body;

        const message = new Message({ sender, receiver, content });
        await message.save();

        res.status(201).json({ message: "Message sent successfully", data: message });
    } catch (error) {
        res.status(500).json({ error: "Error sending message" });
    }
});

// 📌 Get private messages between two users
router.get("/chat/:user1/:user2", async (req, res) => {
    try {
        const { user1, user2 } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: user1, receiver: user2 },
                { sender: user2, receiver: user1 }
            ]
        }).sort("timestamp");

        res.status(200).json({ messages });
    } catch (error) {
        res.status(500).json({ error: "Error retrieving messages" });
    }
});

module.exports = router;
