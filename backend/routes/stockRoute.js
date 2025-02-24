const express = require('express');
const router = express.Router();
const Stock = require("../models/stockSchema");

router.post("/", async (req,res) => {
    try{
        const {lotId,vegetableName,farmerName,paymentStatus,numberOfBags} = req.body;
    const newStock = new Stock({
        lotName,
        vegetableName,
        farmerName,
        paymentStatus,
        numberOfBags,
        createdBy
    });
    await newStock.save();
    res.status(201).json({message:"Stock added successfully",stock:newStock});
    }catch(err){
        res.status(400).json({error:err.message})
    }
});

router.get("/", async(req,res) => {
    try{
        const stocks = await Stock.find();
        res.status(200).json(stocks);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.get("/:lotName", async(req,res) => {
    try{
        const stock = await Stock.findOne({lotName:req.params.lotName});
        if(!stock) return res.status(404).json({message:"Stock not found"});
        res.status(200).json(stock);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.get("/farmer/:farmerName", async(req,res) => {
    try{
        const farmerName = req.params.farmerName;
        const stock = await Stock.find({ farmerName: { $regex: new RegExp(`^${farmerName}$`, "i") } });
        if(!stock) return res.status(404).json({message:"Stock not found"});
        res.status(200).json(stock);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.get("/vegetable/:vegetableName", async(req,res) => {
    try{
        const vegetableName = req.params.vegetableName;
        const stock = await Stock.find({ vegetableName: { $regex: new RegExp(`^${vegetableName}$`, "i") } });
        if(!stock) return res.status(404).json({message:"Stock not found"});
        res.status(200).json(stock);
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.get("/date/:date", async (req, res) => {
    try {
        const date = new Date(req.params.date);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const stocks = await Stock.find({
            timeStamp: { $gte: startOfDay, $lte: endOfDay }
        });

        if (stocks.length === 0) return res.status(404).json({ message: "No stocks found for this date" });

        res.status(200).json(stocks);
    } catch (err) {
        res.status(500).json({ error: `Error fetching stocks: ${err.message}` });
    }
});

router.get("/month/:year/:month", async (req, res) => {
    try {
        const year = parseInt(req.params.year);
        const month = parseInt(req.params.month) - 1;

        const startOfMonth = new Date(year, month, 1, 0, 0, 0);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

        const stocks = await Stock.find({
            timeStamp: { $gte: startOfMonth, $lte: endOfMonth }
        });

        if (stocks.length === 0) return res.status(404).json({ message: "No stocks found for this month" });

        res.status(200).json(stocks);
    } catch (err) {
        res.status(500).json({ error: `Error fetching stocks: ${err.message}` });
    }
});

router.put("/:lotName", async(req,res) => {
    try{
        const updatedStock = await Stock.findOneAndUpdate({lotName:req.params.lotName},req.body,{new:true, runValidators:true});
        if(!updatedStock) return res.status(404).json({message:"Stock not found"});
        res.status(200).json({message:"Stock updated successfully",stock:updatedStock});
    }catch(err){
        res.status(400).json({error:err.message})
    }
});

router.delete("/:lotName", async(req,res) => {
    try{
        const deletedStock = await Stock.findOneAndDelete({lotName:req.params.lotName});
        if(!deletedStock) return res.status(404).json({message:"Stock not found"});
        res.status(200).json({message:"Stock deleted successfully",stock:deletedStock});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

module.exports = router;