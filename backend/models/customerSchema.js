const { default: mongoose } = require("mongoose");

const customerSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        unique: true, 
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    villageName: {
        type: String,
        required: true
    },
    groupName: {
        type: String,
        required: true
    },
    balance:{
        type: Number,
        default: 0
    },
    createdBy:{
        type: String,
        required:true,
    },
    modifiedBy: { 
        type: String, 
    }
});

module.exports = mongoose.model("Customer", customerSchema);
