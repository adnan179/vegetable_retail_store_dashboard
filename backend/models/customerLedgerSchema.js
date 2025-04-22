const { default: mongoose } = require("mongoose");

const customerLedgerSchema = new mongoose.Schema({
    customerName: { type: String, required: true },
    type: { type: String, enum: ['sale', 'credit'], required: true }, // 'sale' = customer owes money, 'credit' = payment
    referenceId: { type: String }, // saleId or creditId
    amount: { type: Number, required: true }, // sale => +amount, credit => -amount
    previousBalance: { type: Number, required: true },
    updatedBalance: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("CustomerLedger", customerLedgerSchema);
