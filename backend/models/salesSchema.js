const { default: mongoose } = require("mongoose");


const salesSchema = new mongoose.Schema({
    salesId:{
        type: String,
        required:true,
        unique:true
    },
    customerName:{
        type:String,
        required:true
    },
    numberOfKgs:{
        type:Number,
        required:true
    },
    pricePerKg:{
        type:Number,
        required:true
    },
    lotName:{
        type: String,
        required:true
    },
    paymentType:{
        type:String,
        required:true,
        default:"cash"
    },
    totalAmount:{
        type:Number,
        required:true
    },
    createdBy:{
        type:String,
        required:true,
    },
    modifiedBY:{
        type: String,
    },
});

module.exports = mongoose.model("SalesSchema",salesSchema);