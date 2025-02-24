const { default: mongoose } = require("mongoose");

const stockSchema = new mongoose.Schema({
    lotName:{
        type: String,
        required:true,
        unique:true
    },
    numberOfBags:{
        type: Number,
        required:true
    },
    vegetableName:{
        type: String,
        required:true
    },
    farmerName:{
        type: String,
        required:true
    },
    paymentStatus:{
        type: Boolean,
        required:true
    },
    amount:{
        type: Number,
        default:0
    },
    createdBy:{
        type: String,
        required:true,
    },
    modifiedBY:{
        type: String,
    }
});

module.exports = mongoose.model("StockSchema", stockSchema);