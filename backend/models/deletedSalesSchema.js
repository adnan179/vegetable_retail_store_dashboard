const mongoose = require("mongoose");

const deletedSalesSchema = new mongoose.Schema({
    // Original sales fields
    salesId: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    numberOfKgs: {
        type: Number,
        required: true
    },
    pricePerKg: {
        type: Number,
        required: true
    },
    lotName: {
        type: String,
        required: true
    },
    paymentType: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    createdBy: {
        type: String,
        required: true
    },
    modifiedBy: {
        type: String
    },

    // Additional fields for deletion tracking
    deletedBy: {
        type: String,
        required: true
    },
    deletedAt: {
        type: Date,
        default: Date.now,
        required: true
    }
});

module.exports = mongoose.model("DeletedSales", deletedSalesSchema);