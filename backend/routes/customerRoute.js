const express = require('express');
const router = express.Router();

const Customers = require("../models/customerSchema");

router.post("/", async(req,res) => {
    try{
        const { customerName, phoneNumber, villageName, groupName, createdBy} = req.body;
        const newCustomer = new Customers({ customerName, phoneNumber, villageName, groupName,balance:0, createdBy });
        await newCustomer.save();
        res.status(201).json({message: "Customer saved successfully",newCustomer})
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("Error saving customer",err.message);
    }
});

router.get("/", async(req,res) => {
    try{
        const customers = await Customers.find();
        if(!customers) return res.status(404).json({message:"Customers not found"});
        res.status(200).json(customers);

    }catch(err){
        res.status(500).json({error:err.message})
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

router.delete("/:customerName", async (req,res) => {
    try{
        const deletedCustomer = await Customers.findOneAndDelete({ customerName: req.params.customerName });
        if(!deletedCustomer) return res.status(404).json({message:"Customer not found"});
        res.status(200).json({message:"Customer deleted successfully", deletedCustomer});
    }catch(err){
        res.status(500).json({error:err.message})
    }
});

module.exports = router;