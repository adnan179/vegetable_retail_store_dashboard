const { default: mongoose } = require("mongoose");

const farmerSchema = new mongoose.Schema({
    farmerName:{
        type: String,
        required: true,
        unique:true
    },
    villageName:{
        type:String,
        required:true,
    },
    group:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String,
        required:true,
        unique:true
    },
    createdBy:{
        type:String,
        required:true
        
    },
    modifiedBy:{
        type:String,

    }
});
module.exports = mongoose.model("FarmerSchema",farmerSchema); 