const mongoose = require("mongoose");

const salesHistorySchema = new mongoose.Schema({
    salesId: {
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

module.exports = mongoose.model("SalesHistory", salesHistorySchema);
