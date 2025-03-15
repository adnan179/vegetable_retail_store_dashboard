const { default: mongoose } = require("mongoose");

const customerHistorySchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    previousData: { type: Object, required: true },
    newData: { type: Object, required: true },
    modifiedBy: { type: String, required: true },
    modifiedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("CustomerHistory", customerHistorySchema);