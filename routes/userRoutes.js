const express = require("express");
const router = express.Router();
const { onlineUsers } = require("../server");

router.get("/online-users", (req, res) => {
    res.json({ onlineUsers: Array.from(onlineUsers) });
});

module.exports = router;
