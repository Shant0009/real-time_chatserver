const express = require("express");
const Group = require("../models/Group");
const router = express.Router();

// 📌 Create a New Group
router.post("/create", async (req, res) => {
    try {
        const { name, members } = req.body;
        const newGroup = new Group({ name, members });
        await newGroup.save();
        res.status(201).json({ message: "Group created successfully", group: newGroup });
    } catch (error) {
        res.status(500).json({ error: "Error creating group" });
    }
});

// 📌 Join a Group
router.post("/join", async (req, res) => {
    try {
        const { groupId, userId } = req.body;
        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        if (!group.members.includes(userId)) {
            group.members.push(userId);
            await group.save();
        }
        res.json({ message: "Joined group successfully" });
    } catch (error) {
        res.status(500).json({ error: "Error joining group" });
    }
});

// 📌 Get Messages from a Group
router.get("/:groupId/messages", async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId).populate("messages.sender", "username");
        if (!group) return res.status(404).json({ error: "Group not found" });

        res.json({ messages: group.messages });
    } catch (error) {
        res.status(500).json({ error: "Error fetching messages" });
    }
});

module.exports = router;
