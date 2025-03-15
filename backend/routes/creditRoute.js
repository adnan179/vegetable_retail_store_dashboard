
const express = require("express");
const router = express.Router();
const Credits = require("../models/creditSchema");
const Customers = require("../models/customerSchema");
const creditHistorySchema = require("../models/creditHistorySchema");

router.post("/", async(req,res) => {
    try{
        const { creditId,customerName, creditAmount,less, createdBy } = req.body;
        const newCredit = new Credits({
            creditId,
            customerName,
            creditAmount,
            less,
            createdBy   
        });
        const customer = await Customers.findOne({ customerName: customerName });
        if (!customer) {
            throw new Error("Customer not found");
        }
        customer.balance -= creditAmount;
        await customer.save();
        await newCredit.save();

        req.io.emit('newCredit',{ message: "New Credit added"});
        res.status(200).json({ message: "Credit added successfully!", credit: newCredit });
    }catch(err){
        res.status(400).json({ message: err.message });
        console.log("Failed to add credit",err.message);
    }
});

router.get("/", async(req,res) => {
    try{
        const credits = await Credits.find().sort({createdAt:-1});
        if(!credits) return res.status(404).json({message:`Cannot find credits ${err.message}`});
        return res.status(200).json(credits);
    }catch(err){
        return res.status(500).json({ message: err.message });
    }
});

router.put("/:creditId", async(req,res) => {
    try{
        const {creditId} = req.params;
        const {creditId:bodyCreditId,...updateData} = req.body;

        if(!updateData.modifiedBy){
            return res.status(400).json({error:"modifiedBy field is required"});
        };

        const updatedCredit = await Credits.findOneAndUpdate(
            {creditId:creditId},
            updateData,
            {new:true}
        );
        if(!updatedCredit) return res.status(404).json({message:"credit not found"});
        res.status(200).json({message:"Credit successfully updated",credit:updatedCredit});
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("Failed to update credit:"+err.message)
    }
});

router.get("/history", async (req,res) => {
  try{
    const creditsHistory = await creditHistorySchema.find().sort({modifiedAt:-1});

    res.status(200).json(creditsHistory);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});
router.delete("/:creditId", async(req,res) => {
    try{
        const credit = await Credits.findOneAndDelete({creditId:req.params.creditId});
        if(!credit) return res.status(404).json({message:"Credit not found"});
        res.status(200).json({message:"Credit successfully deleted",credit});
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("Failed to delete credit:"+err.message)
    }
});

module.exports = router;

