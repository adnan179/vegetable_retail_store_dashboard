const { default: mongoose } = require("mongoose");

const vegetableSchema = new mongoose.Schema({
    vegetableName:{
        type:String,
        required:true,
        unique:true,
    },
    shortName:{
        type:String,
        required:true,
        unique:true,
    }
});

module.exports = mongoose.model("VegetableSchema", vegetableSchema);