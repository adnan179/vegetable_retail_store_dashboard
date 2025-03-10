const express = require("express");
const router = express.Router();
const Farmer = require("../models/farmerSchema");

// Create a new farmer
router.post("/", async (req, res) => {
    try {
        const { farmerName,phoneNumber, villageName, createdBy } = req.body;
        const newFarmer = new Farmer({ farmerName, phoneNumber, villageName, createdBy });
        await newFarmer.save();
        res.status(201).json({ message: "Farmer added successfully!", farmer: newFarmer });
    } catch (error) {
        res.status(400).json({ error: error.message });
        console.log(error, error.message);
    }
});

// Get all farmers
router.get("/", async (req, res) => {
    try {
        const farmers = await Farmer.find();
        res.status(200).json(farmers);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get("/village/:villageName", async(res,req) =>{
    try{
        const farmers = await Farmer.find({villageName:req.params.villageName});
        if(!farmers) return res.status(404).json({message:"Farmers not found "});
        res.status(200).json(farmers);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

// Update a farmer by ID
router.put("/:name", async (req, res) => {
    try {
        const updatedFarmer = await Farmer.findOneAndUpdate({farmerName:req.params.name}, req.body, { new: true });
        if (!updatedFarmer) return res.status(404).json({ message: "Farmer not found" });
        res.status(200).json({ message: "Farmer updated successfully", farmer: updatedFarmer });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Delete a farmer by ID
router.delete("/:name", async (req, res) => {
    try {
        const deletedFarmer = await Farmer.findOneAndDelete({farmerName:req.params.name});
        if (!deletedFarmer) return res.status(404).json({ message: "Farmer not found" });
        res.status(200).json({ message: "Farmer deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
