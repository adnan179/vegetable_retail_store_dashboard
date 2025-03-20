const { default: mongoose } = require("mongoose");

const creditSchema = new mongoose.Schema({
    creditId: {
        type: String,
        required: true,
        unique: true
    },
    customerName: {
        type: String,
        required: true
    },
    less: {
        type: Number,
        default: 0
    },
    creditAmount: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number
    },
    createdBy: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    modifiedBy: {
        type: String
    }
}, { timestamps: true });

/**
 * Middleware to ensure totalAmount is always updated before saving
 */
creditSchema.pre("save", function (next) {
    this.totalAmount = this.creditAmount + this.less;
    next();
});

creditSchema.pre("findOneAndUpdate", async function (next) {
    const update = this.getUpdate();
    
    // Ensure totalAmount is updated
    if (update.creditAmount !== undefined || update.less !== undefined) {
        const credit = await this.model.findOne(this.getQuery());
        if (credit) {
            update.totalAmount = (update.creditAmount ?? credit.creditAmount) + (update.less ?? credit.less);
        }
    }

    // Maintain versioning in CreditHistory
    const CreditHistory = require("./creditHistorySchema");
    const credit = await this.model.findOne(this.getQuery());
    if (credit) {
        await CreditHistory.create({
            creditId: credit.creditId,
            previousData: credit.toObject(),
            newData: update,
            modifiedBy: update.modifiedBy,
            modifiedAt: new Date()
        });
    }

    next();
});

module.exports = mongoose.model("Credits", creditSchema);
