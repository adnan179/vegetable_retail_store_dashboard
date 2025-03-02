
const express = require("express");
const router = express.Router();
const Credits = require("../models/creditSchema");

router.post("/", async(req,res) => {
    try{
        const { creditId,customerName, creditAmount, createdBy } = req.body;
        const newCredit = new Credits({
            creditId,
            customerName,
            creditAmount,
            createdBy   
        });
        await newCredit.save();
        res.status(201).json({ message: "Credit added successfully!", credit: newCredit });
    }catch(err){
        res.status(400).json({ message: err.message });
        console.log("Failed to add credit",err.message);
    }
});

router.get("/", async(req,res) => {
    try{
        const credits = await Credits.find();
        if(!credit) return res.status(404).json({message:`Cannot find credits ${err.message}`});
        return res.status(200).json(credits);
    }catch(err){
        return res.status(500).json({ message: err.message });
    }
});

router.get("/:customerName", async(req,res) => {
    try{
        const credit = await Credits.findOne({ customerName: req.params.customerName });
        if(!credit) return res.status(404).json({message:`Cannot find credit ${err.message}`});
        res.status(200).json(credit);
    }catch(err){
        res.status(500).json({ message: err.message });
    }
});

router.get("/date/:date",async(req,res) => {
    try{
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0,0,0,0));
        const endOfDay = new Date(date.setHours(23,59,59,999));
        const credits = await Credits.find({
            timeStamp: { $gte:startOfDay, $lte:endOfDay}
        });
        if(credits.length === 0) return res.status(404).json({message:"Cannot find any credit details for the given date"});
        res.status(201).json(credits)
    }catch(err){
        res.status(500).json({error:err.message})
    }
});

router.get("/month/:year/:month", async (req,res) => {
    try{
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month);

        const startOfMonth = new Date(year,month,1,0,0,0);
        const endOfMonth = new Date(year,month+1,0,23,59,59);

        const credits = await Credits.find({
            timeStamp:{$gte:startOfMonth,$lte:endOfMonth}
        });
        if(credits.length === 0) return res.status(404).json({message:"no credits for the given month"});
        res.status(201),json(credits)
    }catch(err){
        res.status(500).json({error:err.message})
    }
});

router.put("/:creditId", async(req,res) => {
    try{
        const creditId = req.params.creditId;
        const updatedData = {
            ...req.body,
            dateModified: new Date(),
        }
        const updatedCredit = await Credits.findOneAndUpdate({creditId:creditId},updatedData,{new:true, runValidators:true});
        if(!updatedCredit) return res.status(404).json({message:"credit not found"});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.delete("/:creditId", async(req,res) => {
    try{
        const credit = await Credits.findOneAndDelete({creditId:req.params.creditId});
        if(!credit) return res.status(404).json({message:"Credit not found"});
        res.status(200),json({message:"Credit successfully deleted",credit})
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

module.exports = router;

