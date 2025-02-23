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
    balance: {
        type: Number,
        default: 0
    },
    timeStamp:{
        type: Date,
        required:true,
        default: new Date()
    },
    dateModified: { 
        type: Date,
    },
    modifiedBy: { 
        type: String, 
        default: "System"
    }
});

module.exports = mongoose.model("Customer", customerSchema);
