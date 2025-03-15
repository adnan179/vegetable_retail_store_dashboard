const { default: mongoose } = require("mongoose");

const customersSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        unique: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    villageName:{
        type: String,
        required: true
    },
    groupName:{
        type: String,
        required: true
    },
    balance:{
        type: Number,
        default: 0
    },
    createdBy: {
        type: String,
        required: true,
    },
    modifiedBy: {
        type: String,
    },
}, { timestamps: true });

customersSchema.pre("findOneAndUpdate", async function (next) {
    const CustomersHistory = require("./customersHistorySchema");
    const customer = await this.model.findOne(this.getQuery());

    if (customer) {
        await CustomersHistory.create({
            customerName: customer.customerName,
            previousData: customer.toObject(),
            newData: this.getUpdate(),
            modifiedBy: this.getUpdate().modifiedBy,
            modifiedAt: new Date()
        });
    }
    next();
});

module.exports = mongoose.model("Customers", customersSchema);