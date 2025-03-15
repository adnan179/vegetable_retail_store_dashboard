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
    createdAt:{
        type: Date,
        default: Date.now,
    },
    modifiedBy:{
        type: String,
    },
}, {timestamps:true});

salesSchema.pre("findOneAndUpdate", async function (next) {
    const SalesHistory = require("./salesHistorySchema");
    const sales = await this.model.findOne(this.getQuery());

    if (sales){
        await SalesHistory.create({
            salesId:sales.salesId,
            previousData: sales.toObject(),
            newData:this.getUpdate(),
            modifiedBy:this.getUpdate().modifiedBy,
            modifiedAt: new Date()
        });
    }
    next();
});

module.exports = mongoose.model("Sales",salesSchema);