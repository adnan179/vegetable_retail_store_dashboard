const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Sales = require("../models/salesSchema");
const Stock = require("../models/stockSchema");
const Credit = require("../models/creditSchema");
const Customer = require("../models/customerSchema");

router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      salesId,
      customerName,
      lotName,
      numberOfKgs,
      pricePerKg,
      paymentType,
      totalAmount,
      kuli,
      createdBy,
      creditId,
    } = req.body;

    // Find customer and update balance
    if(paymentType === 'jamalu'){
      const customer = await Customer.findOne({ customerName }).session(session);
      if (!customer) {
        throw new Error("Customer not found");
      }
      customer.balance += totalAmount;
      await customer.save({ session });
    }

    // Check stock availability
    const stock = await Stock.findOne({ lotName }).session(session);
    if (!stock) {
      throw new Error("Stock not found");
    }
    if (stock.numberOfBags <= 0) {
      throw new Error("Insufficient stock");
    }
    stock.numberOfBags -= 1;
    await stock.save({ session });

    // Handle credit logic
    let credit = null;
    if (paymentType.split("-")[0] === "jamalu") {
      credit = new Credit({
        creditId,
        customerName,
        creditAmount: totalAmount,
        createdBy,
      });
      await credit.save({ session });
    }

    // Create new sale entry
    const newSale = new Sales({
      salesId,
      customerName,
      lotName,
      numberOfKgs,
      pricePerKg,
      paymentType,
      totalAmount,
      kuli,
      createdBy,
      creditId,
    });
    await newSale.save({ session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ message: "Sale added successfully", sale: newSale });
  } catch (err) {
    // Rollback changes if any error occurs
    await session.abortTransaction();
    session.endSession();

    console.error("Transaction failed:", err.message);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async(req,res) => {
  try{
    const sales = await Sales.find();
    res.status(200).json(sales);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});


router.get("/:salesId", async(req,res) => {
  try{
    const sale = await Sale.findOne({salesId:req.params.salesId});
    if(!sale) return res.status(404).json({message:"Sale not found"});
    res.status(200).json(sale);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});

router.put("/:salesId", async(req,res) => {
  try{
    const updatedSale = await Sales.findOneAndUpdate({salesId:req.params.salesId},req.body,{new:true, runValidators:true});
    if(!updatedSale) return res.status(404).json({message:"Sale not found"});
    res.status(200).json({message:"Sale updated successfully",stock:updatedSale});
  }catch(err){
    res.status(400).json({error:err.message})
  }
});

router.delete("/:salesId", async (req,res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const sale = await Sales.findOne({salesId:req.params.salesId}).session(session);
    if(!sale){
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({message:"Sale not found"});
    }
    if(sale.paymentType.startsWith("jamalu-")){
      const creditId = sale.paymentType.replace("jamalu-","");
      await Credit.findOneAndDelete({ creditId:creditId}).session(session);
    }

    await Sales.deleteOne({salesId:req.params.salesId}).session(session);
    await session.commitTransaction();
    session.endSession();
    res.status(200).json({message:"Sale and associated credit deleted successfully"});
  }catch(err){
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({error:err.message});
    console.log("failed to delete the sale and associated credit",err.message);
  }
})

module.exports = router;