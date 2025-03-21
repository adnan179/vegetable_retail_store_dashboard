const express = require('express');
const mongoose = require('mongoose');
require("dotenv").config();
const axios = require('axios');

const Sales = require("../models/salesSchema");
const Stock = require("../models/stockSchema");
const Credit = require("../models/creditSchema");
const Customer = require("../models/customerSchema");
const DeletedSales = require('../models/deletedSalesSchema');
const salesHistorySchema = require('../models/salesHistorySchema');

const router = express.Router();
const WHATSAPP_API_URL = "https://graph.facebook.com/v19.0";
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;

const formatSalesMessage = (customerName, sales) => {
  let message = `Hello ${customerName}, here is your bill \n\n`;
  let totalAmount = 0;

  sales.forEach((sale,idx) => {
    const itemTotal = sale.totalAmount;
    totalAmount += itemTotal;
    message += `${idx +1}. Lot: ${sale.lotName}, kgs: ${sale.numberOfKgs}, price per Kg: ${sale.pricePerKg}, Total: ${itemTotal} \n\n`;

  });
  message += `Total Amount: ${totalAmount}`;
  console.log("Message being sent:", message);
  return message;

};

router.post("/send-whatsapp-messages", async (req, res) => {
  try {
    const salesData = req.body.sales; // Sales data sent from the frontend

    if (!salesData || salesData.length === 0) {
      return res.status(400).json({ message: "No sales data provided" });
    }

    // Group sales by customer
    const salesByCustomer = salesData.reduce((acc, sale) => {
      acc[sale.customerName] = acc[sale.customerName] || [];
      acc[sale.customerName].push(sale);
      return acc;
    }, {});

    const messagesSent = [];

    // Loop through customers and send messages
    for (const [customerName, customerSales] of Object.entries(salesByCustomer)) {
      // Fetch customer phone number from database
      const customer = await Customer.findOne({ customerName });

      if (!customer || !customer.phoneNumber) {
        console.log(`No phone number found for ${customerName}`);
        continue;
      }

      const phoneNumber = `+91${customer.phoneNumber}`;
      const message = formatSalesMessage(customerName, customerSales);

      // Send WhatsApp message
      const response = await axios.post(
        `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          type: "text",
          text: { body: message },
        },
        {
          headers: {
            Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      messagesSent.push({
        customerName,
        phoneNumber,
        status: response.data,
      });
    }

    res.status(200).json({ message: "Messages sent successfully", data: messagesSent });
  } catch (error) {
    console.error("Error sending WhatsApp messages:", error.response?.data || error.message);
    res.status(500).json({ message: "Error sending messages", error: error.response?.data || error.message });
  }
});
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
        console.log("customer not found")
        return res.status(404).json("Customer not found");
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
    console.log("Transaction failed:", err.message);
    await session.abortTransaction();
    session.endSession();
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

router.get("/kuli", async (req, res) => {
  try {
      const kuliCustomers = await Customer.find({ kuli: true }).select("customerName");
      const customerNames = kuliCustomers.map(c => c.customerName);

      const sales = await Sales.find({ customerName: { $in: customerNames } });
      res.status(200).json(sales);
  } catch (error) {
      res.status(500).json({ error: "Error fetching sales" });
  }
});


module.exports = router;