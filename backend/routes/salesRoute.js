const express = require('express');
const mongoose = require('mongoose');

const Sales = require("../models/salesSchema");
const Stock = require("../models/stockSchema");
const Credit = require("../models/creditSchema");
const Customer = require("../models/customerSchema");
const DeletedSales = require('../models/deletedSalesSchema');
const salesHistorySchema = require('../models/salesHistorySchema');

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
    });
    await newSale.save({ session });
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
     // emit the new sale to all connected clients
     req.io.emit('newSale',{message:"New sale added"});

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
    const sales = await Sales.find().sort({createdAt:-1});
    res.status(200).json(sales);
  }catch(err){
    res.status(500).json({error:err.message});
  }
});
  

router.put("/:salesId", async (req, res) => {
  try {
      const { salesId } = req.params;
      const {salesId:bodySalesId,...updateData} = req.body;
      
      // Ensure `modifiedBy` is provided from the frontend
      if (!updateData.modifiedBy) {
          return res.status(400).json({ error: "modifiedBy field is required" });
      }

      const updatedSales = await Sales.findOneAndUpdate(
          { salesId:salesId }, 
          updateData, 
          { new: true }
      );

      if (!updatedSales) {
          return res.status(404).json({ message: "Sales record not found" });
      }

      res.status(200).json({ message: "Sales updated successfully", updatedSales });

  } catch (error) {
      res.status(500).json({ error: error.message });
      console.log("Failed to update Sales: " + error.message)
  }
});

router.get("/history", async (req,res) => {
  try{
    const salesHistory = await salesHistorySchema.find().sort({modifiedAt:-1});

    res.status(200).json(salesHistory);
  }catch(err){
    res.status(500).json({error:err.message});
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

    // Increment remainingBags in StockSchema
    const stock = await Stock.findOne({ lotName: sale.lotName }).session(session);
    if (stock) {
      stock.remainingBags += 1;
      await stock.save({ session });
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
    const deletedSales = await DeletedSales.find().sort({deletedAt:-1});
    res.status(200).json(deletedSales);
  } catch (err) {
    res.status(500).json({ error: err.message });
    console.log("failed to fetch the deleted sales",err.message);
  }
});

module.exports = router;