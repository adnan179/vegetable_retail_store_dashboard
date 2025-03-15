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
    const stocks = await Stock.find({ numberOfBags: { $gt: 0 } }).sort({createdAt:-1});
    res.status(200).json(stocks);
  }catch(err){
    res.status(500).json({error:err.message});
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
router.get("/:lotName", async(req,res) => {
  try{
    const stock = await Stock.findOne({lotName:req.params.lotName});
    if(!stock) return res.status(404).json({message:"Stock not found"});
    res.status(200).json(stock);
  }catch(err){
    res.status(500).json({error:err.message});
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