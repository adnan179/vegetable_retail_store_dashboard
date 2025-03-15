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
    createdBy:{
        type:String,
        required:true
    },
    createdAt:{
        type: Date,
        default: Date.now()
    },
    modifiedBY:{
        type: String,
       
    }
},{timestamps:true});

creditSchema.pre("findOneAndUpdate", async function (next){
    const CreditHistory = require("./creditHistorySchema");
    const credit = await this.model.findOne(this.getQuery());
    if(credit){
        await CreditHistory.create({
            creditId:credit.creditId,
            previousData: credit.toObject(),
            newData: this.getUpdate(),
            modifiedBy: this.getUpdate().modifiedBy,
            modifiedAt: new Date()
        })
    }
    next();
})
module.exports = mongoose.model("Credits", creditSchema);