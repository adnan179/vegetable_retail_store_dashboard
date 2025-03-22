const express = require('express');
const router = express.Router();
const Stock = require("../models/stockSchema");
const stockHistorySchema = require("../models/stockHistorySchema");

router.post("/", async (req,res) => {
  try{
    const {lotName,vegetableName,farmerName,paymentStatus,numberOfBags, createdBy,createdAt} = req.body;
    const newStock = new Stock({
        lotName,
        vegetableName,
        farmerName,
        paymentStatus,
        numberOfBags,
        createdBy,
        createdAt
    });
    await newStock.save();
    res.status(201).json({message:"Stock added successfully",stock:newStock});
  }catch(err){
      res.status(400).json({error:err.message});
      console.log("Error adding stock",err.message)
  }
});

router.get("/", async(req,res) => {
  try{
    const stocks = await Stock.find({ remainingBags: { $gt: 0 } }).sort({createdAt:-1});
    
    if (stocks.length === 0) {
      return res.status(404).json({ message: "No stocks found with remaining bags" });
    }
    
    res.status(200).json(stocks);
  }catch(err){
    console.error("Error fetching stocks:", err);
    res.status(500).json({error: "Internal server error"});
  }
});

router.get("/history", async (req,res) => {
  try{
    const stocksHistory = await stockHistorySchema.find().sort({modifiedAt:-1});

    res.status(200).json(stocksHistory);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

router.put("/:lotName", async (req, res) => {
  try {
      const existingStock = await Stock.findOne({ lotName: req.params.lotName });
      if (!existingStock) {
          return res.status(404).json({ message: "Stock not found" });
      }

      // If numberOfBags is being updated, adjust remainingBags accordingly
      if (req.body.numberOfBags !== undefined) {
          const diff = req.body.numberOfBags - existingStock.numberOfBags;
          req.body.remainingBags = existingStock.remainingBags + diff;
      }

      const updatedStock = await Stock.findOneAndUpdate(
          { lotName: req.params.lotName },
          req.body,
          { new: true }
      );

      res.status(200).json({ message: "Stock updated successfully", stock: updatedStock });
  } catch (err) {
      res.status(400).json({ error: err.message });
      console.log("Failed to update stock: " + err.message);
  }
});

router.put("/:lotName", async (req, res) => {
  try {
      // Check if numberOfBags is being updated
      if (req.body.numberOfBags !== undefined) {
          req.body.remainingBags = req.body.numberOfBags;
      }

      const updatedStock = await Stock.findOneAndUpdate(
          { lotName: req.params.lotName },
          req.body,
          { new: true }
      );
      
      if (!updatedStock) return res.status(404).json({ message: "Stock not found" });
      res.status(200).json({ message: "Stock updated successfully", stock: updatedStock });
  } catch (err) {
      res.status(400).json({ error: err.message });
      console.log("Failed to update stock:" + err.message);
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