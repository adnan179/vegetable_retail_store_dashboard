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
    pricePerKgs:{
        type:Number,
    },
    lotId:{
        type: String,
        required:true
    },
    paymentType:{
        type:String,
        required:true,
        default:"Cash"
    },
    totalAmount:{
        type:Number,
        required:true
    },
    kuli:{
        type:Boolean,
        required:true,
        default:false
    },
    modifiedBY:{
        type: String,
        default:"system"
    },
    dateModified:{
        type: Date,
        default:Date.now()
    }
});

module.exports = mongoose.model("SalesSchema",salesSchema);