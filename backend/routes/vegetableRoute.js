const express = require("express");
const router = express.Router();
const Vegetable = require("../models/vegetableSchema");

// Create a new farmer
router.post("/", async (req, res) => {
    try {
        const { vegetableName,shortName } = req.body;
        const newVegetable = new Vegetable({ vegetableName,shortName });
        await newVegetable.save();
        res.status(201).json({ message: "Vegetable added successfully!", vegetable: newVegetable });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get all farmers
router.get("/", async (req, res) => {
    try {
        const vegetables = await Vegetable.find();
        res.status(200).json(vegetables);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get a single farmer by ID
router.get("/:name", async (req, res) => {
    try {
        const vegetable = await Vegetable.findOne({vegetableName:req.params.name});
        if (!vegetable) return res.status(404).json({ message: "Vegetable not found" });
        res.status(200).json(vegetable);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a farmer by ID
router.put("/:name", async (req, res) => {
    try {
        const updatedVegetable = await Vegetable.findOneAndUpdate({vegetableName:req.params.name}, req.body, { new: true });
        if (!updatedVegetable) return res.status(404).json({ message: "Vegetable not found" });
        res.status(200).json({ message: "Vegetable updated successfully", vegetable: updatedVegetable });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a farmer by ID
router.delete("/:name", async (req, res) => {
    try {
        const deletedVegetable = await Vegetable.findOneAndDelete({vegetableName:req.params.name});
        if (!deletedVegetable) return res.status(404).json({ message: "Farmer not found" });
        res.status(200).json({ message: "Vegetable deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
