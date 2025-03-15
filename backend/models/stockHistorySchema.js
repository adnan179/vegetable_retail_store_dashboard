const mongoose = require("mongoose");

const stockHistorySchema = new mongoose.Schema({
    lotName: {
        type: String,
        required: true
    },
    previousData: {
        type: Object,
        required: true
    },
    newData: {
        type: Object,
        required: true
    },
    modifiedBy: {
        type: String,
        required: true
    },
    modifiedAt: {
        type: Date,
        default: Date.now
    }
});

const StockHistory = mongoose.model("StockHistory", stockHistorySchema);
module.exports = StockHistory;
