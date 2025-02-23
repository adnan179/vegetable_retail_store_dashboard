const express = require("express");
const router = express.Router();
const Groups = require("../models/groupSchema");

// Create a new group
router.post("/", async (req, res) => {
    try {
        const { groupName } = req.body;
        const newGroup = new Groups({ groupName });
        await newGroup.save();
        res.status(201).json({ message: "Group added successfully!", group: newGroup });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all groups
router.get("/", async (req, res) => {
    try {
        const groups = await Groups.find();
        res.status(200).json(groups);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Delete a group by ID
router.delete("/:name", async (req, res) => {
    try {
        const deletedGroup = await Groups.findOneAndDelete({groupName:req.params.name});
        if (!deletedGroup) return res.status(404).json({ message: "Group not found" });
        res.status(200).json({ message: "Group deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
