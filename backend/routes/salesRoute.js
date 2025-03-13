const express = require('express');
const mongoose = require('mongoose');

const Sales = require("../models/salesSchema");
const Stock = require("../models/stockSchema");
const Credit = require("../models/creditSchema");
const Customer = require("../models/customerSchema");
const DeletedSales = require('../models/deletedSalesSchema');

const router = express.Router();
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
      createdBy,
      creditId,
    } = req.body;

    // Find customer and update balance
    if(paymentType === 'credit'){
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
    stock.remainingBags -= 1;
    await stock.save({ session });

    // Handle credit logic
    let credit = null;
    if (paymentType.split("-")[0] === "credit") {
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
      createdBy,
      creditId,
    });
    await newSale.save({ session });
     // emit the new sale to all connected clients
     req.io.emit('newSale',newSale)
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
  
router.put("/:salesId", async(req,res) => {
  try{
    const updatedSale = await Sales.findOneAndUpdate({salesId:req.params.salesId},req.body,{new:true, runValidators:true});
    if(!updatedSale) return res.status(404).json({message:"Sale not found"});
    res.status(200).json({message:"Sale updated successfully",sale:updatedSale});
  }catch(err){
    res.status(400).json({error:err.message})
  }
});
  
router.delete("/:salesId", async (req,res) => {
  const { deletedBy } = req.body;
  if (!deletedBy) {
    return res.status(400).json({ message: "deletedBy field is required" });
  }
  const session = await mongoose.startSession();
  session.startTransaction();
  try{
    const sale = await Sales.findOne({salesId:req.params.salesId}).session(session);
    if(!sale){
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({message:"Sale not found"});
    };

    const deletedSale = new DeletedSales({
      ...sale.toObject(),
      deletedBy: deletedBy,
      deletedAt: new Date(),
    });

    await deletedSale.save({ session });
    if(sale.paymentType.startsWith("credit-")){
      const creditId = sale.paymentType.replace("credit-","");
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
});
  
router.get("/deletedSales", async (req, res) => {
  try {
    const deletedSales = await DeletedSales.find();
    res.status(200).json(deletedSales);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("failed to fetch the deleted sales",err.message);
  }
});
  
router.post("/undo-delete/:salesId", async(req,res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try{
    const deletedSale = await DeletedSales.findOne({salesId:req.params.salesId}).session(session);
    if(!deletedSale){
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({message:"Deleted sale not found"});
    }
    // Restore the sale back to SalesSchema
    const restoredSale = new Sales({
      salesId: deletedSale.salesId,
      customerName: deletedSale.customerName,
      numberOfKgs: deletedSale.numberOfKgs,
      pricePerKg: deletedSale.pricePerKg,
      lotName: deletedSale.lotName,
      paymentType: deletedSale.paymentType,
      totalAmount: deletedSale.totalAmount,
      createdBy: deletedSale.createdBy,
      modifiedBy: deletedSale.modifiedBy || null,
    });

    await restoredSale.save({ session });

    await DeletedSales.deleteOne({salesId:req.params.salesId}).session(session);

    await session.commitTransaction();
    session.endSession();
    res.status(200).json({message:"Deleted sale restored successfully", sale:restoredSale});
  }catch(err){
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({error:err.message});
    console.log("failed to restore the deleted sale",err.message);
  }
});


module.exports = router;