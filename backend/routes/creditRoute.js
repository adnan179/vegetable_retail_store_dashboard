
const express = require("express");
const router = express.Router();
const Credits = require("../models/creditSchema");
const Customers = require("../models/customerSchema");
const creditHistorySchema = require("../models/creditHistorySchema");
const CustomerLedger = require("../models/customerLedgerSchema");

router.post("/", async (req, res) => {
    try {
        const { creditId, customerName, creditAmount, less, createdBy } = req.body;

        const totalAmount = parseInt(creditAmount) + parseInt(less);

        // Create the credit entry
        const newCredit = new Credits({
            creditId,
            customerName,
            creditAmount,
            less,
            totalAmount,
            createdBy
        });

        // Find customer
        const customer = await Customers.findOne({ customerName });
        if (!customer) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const prevBalance = customer.balance;
        customer.balance = parseInt(customer.balance) - totalAmount;
        await customer.save();

        // Create ledger entry
        await CustomerLedger.create({
            customerName,
            type: "credit",
            referenceId: creditId,
            amount: totalAmount,
            previousBalance: prevBalance,
            currentBalance: customer.balance,
            updatedBalance: customer.balance,
            createdBy
        });

        await newCredit.save();

        req.io.emit('newCredit', {
            message: "New Credit added",
            credit: newCredit
        });

        res.status(200).json({
            message: "Credit added successfully!",
            credit: newCredit
        });
    } catch (err) {
        console.error("Failed to add credit", err.message);
        res.status(400).json({ message: err.message });
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
router.delete("/:creditId", async (req, res) => {
    try {
      const credit = await Credits.findOneAndDelete({ creditId: req.params.creditId });
      if (!credit) return res.status(404).json({ message: "Credit not found" });
  
      const customer = await Customers.findOne({ customerName: credit.customerName });
      if (!customer) return res.status(404).json({ message: "Customer not found" });
  
      // Restore customer balance
      customer.balance = parseInt(customer.balance) + parseInt(credit.totalAmount);
      await customer.save();
  
      // Delete associated ledger entry
      await CustomerLedger.deleteOne({ referenceId: req.params.creditId });
  
      res.status(200).json({ message: "Credit and ledger deleted successfully", credit });
    } catch (err) {
      console.log("Failed to delete credit:", err.message);
      res.status(500).json({ error: err.message });
    }
  });
  

module.exports = router;

