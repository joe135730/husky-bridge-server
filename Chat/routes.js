import express from "express";
import * as dao from "./dao.js";

export default function ChatRoutes(app) {
    // Get messages in a room
    app.get("/api/chat/:roomId", async (req, res) => {
        try {
            const messages = await dao.findMessagesByRoomId(req.params.roomId);
            res.json(messages);
        } catch (err) {
            console.error("Failed to retrieve messages:", err);
            res.status(500).json({ message: "Failed to retrieve messages" });
        }
    });

    // Create/send a new message
    app.post("/api/chat", async (req, res) => {
        try {
            const currentUser = req.session["currentUser"];
            if (!currentUser) {
                return res.status(401).json({ message: "Not authenticated" });
            }

            const newMessage = {
                roomId: req.body.roomId,
                senderId: currentUser._id,
                receiverId: req.body.receiverId,
                message: req.body.message,
                timestamp: new Date(),
            };

            const saved = await dao.createMessage(newMessage);
            res.json(saved);
        } catch (err) {
            console.error("Failed to send message:", err);
            res.status(500).json({ message: "Failed to send message" });
        }
    });
}
