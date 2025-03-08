const { default: mongoose } = require("mongoose");

const creditSchema = new mongoose.Schema({
    creditId:{
        type:String,
        required:true,
        unique:true
    },
    customerName:{
        type:String,
        required:true
    },
    less:{
        type:Number,
        default: 0
    },
    creditAmount:{
        type:Number,
        required:true
    },
    payment:{
        type: String,
        default: "payment due",
    },
    createdBy:{
        type:String,
        required:true
    },
    modifiedBY:{
        type: String,
       
    }
});

module.exports = mongoose.model("CreditSchema", creditSchema);