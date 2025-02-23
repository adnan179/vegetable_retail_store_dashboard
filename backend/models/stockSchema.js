const { default: mongoose } = require("mongoose");

const stockSchema = new mongoose.Schema({
    lotId:{
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
    timeStamp:{
        type: Date,
        required:true,
        default: Date.now,
    },
    dateModified:{
        type:Date,
    },
    modifiedBY:{
        type: String,
        default:"system"
    }
});

module.exports = mongoose.model("StockSchema", stockSchema);