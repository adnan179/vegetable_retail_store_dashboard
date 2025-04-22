const express = require('express');
const router = express.Router();

const Customers = require("../models/customerSchema");
const customersHistorySchema = require('../models/customersHistorySchema');
const Sales = require("../models/salesSchema");
const Credits = require("../models/creditSchema");
const CustomerLedger = require("../models/customerLedgerSchema");

router.post("/", async(req,res) => {
    try{
        const { customerName, phoneNumber, villageName, groupName, balance, createdBy,createdAt} = req.body;
        const newCustomer = new Customers({ customerName, phoneNumber, villageName, groupName,balance, createdBy,createdAt });
        await newCustomer.save();
        res.status(201).json({message: "Customer saved successfully",newCustomer});
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("Error saving customer",err.message);
    }
});

router.get("/", async(req,res) => {
    try{
        const customers = await Customers.find().sort({createdAt:-1});
        if(!customers) return res.status(404).json({message:"Customers not found"});
        res.status(200).json(customers);

    }catch(err){
        res.status(500).json({error:err.message});
        console.log(err.message)
    }
});

router.put("/:customerName", async (req, res) => {
    try {
        const updatedCustomer = await Customers.findOneAndUpdate(
            { customerName: req.params.customerName },
            req.body,
            { new: true, runValidators: true } // Ensures updated document is returned
        );

        if (!updatedCustomer) return res.status(404).json({ message: "Customer not found" });

        res.status(200).json({ message: "Customer updated successfully", updatedCustomer });
    } catch (err) {
        res.status(500).json({ error: `Error updating customer: ${err.message}` });
    }
});

// Get Customer History
router.get("/history", async (req, res) => {
    try {
        const history = await customersHistorySchema.find().sort({ modifiedAt: -1 });
        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ error: "Error fetching customer history" });
    }
});

router.delete("/:customerName", async (req,res) => {
    try{
        const deletedCustomer = await Customers.findOneAndDelete({ customerName: req.params.customerName });
        if(!deletedCustomer) return res.status(404).json({message:"Customer not found"});
        res.status(200).json({message:"Customer deleted successfully", deletedCustomer});
    }catch(err){
        res.status(500).json({error:err.message})
    }
});

router.get("/:customerName",async(req,res) =>{
    const { customerName } = req.params;
    try {
        const customer = await Customers.findOne({customerName});
        const ledger = await CustomerLedger.find({customerName}).sort({createdAt:-1});
        if(!customer) {
            console.log("Customer not found");
            return res.status(404).json({message:"Customer not found"});
        }
        if(!ledger) {
            console.log("Ledger not found");
            return res.status(404).json({message:"Ledger not found"});
        }
        const sales = await Sales.find({customerName});
        const credits = await Credits.find({customerName});
        res.status(200).json({customer, ledger});

    }catch(err){
        res.status(500).json({error:err.message});
        console.log(err.message);
    }
});

module.exports = router;