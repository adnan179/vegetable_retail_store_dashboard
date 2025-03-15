const mongoose = require("mongoose");
const StockHistory = require("./stockHistorySchema"); // Import StockHistory model

const stockSchema = new mongoose.Schema({
    lotName: {
        type: String,
        required: true,
        unique: true
    },
    numberOfBags: {
        type: Number,
        required: true
    },
    remainingBags: {
        type: Number,
        default: function () {
            return this.numberOfBags;
        }
    },
    vegetableName: {
        type: String,
        required: true
    },
    farmerName: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    modifiedBy: {
        type: String,
    }
}, { timestamps: true });

stockSchema.pre("findOneAndUpdate", async function (next) {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (docToUpdate) {
        await StockHistory.create({
            lotName: docToUpdate.lotName,
            previousData: docToUpdate.toObject(),
            newData: this.getUpdate(),
            modifiedBy: this.getUpdate().modifiedBy,
            modifiedAt: new Date()
        });
    }
    next();
});

const Stock = mongoose.model("Stocks", stockSchema);
module.exports = Stock;
