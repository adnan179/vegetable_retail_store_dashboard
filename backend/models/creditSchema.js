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
        required:true
    },
    creditAmount:{
        type:Number,
        required:true
    },
    timeStamp:{
        type:Date,
        default:new Date(),
        required:true
    },
    dateModified:{
        type: Date,
        default:Date.now()
    },
    modifiedBY:{
        type: String,
        default:"system"
    }
});

module.exports = mongoose.model("CreditSchema", creditSchema);