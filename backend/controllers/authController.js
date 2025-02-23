const userSchema = require("../models/userSchema");
const jwt = require("jsonwebtoken");

const register = async (req,res) => {
    try{
        const { userName, password, role } = req.body;
        const user = new userSchema({ userName, password, role});
        await user.save();
        res.status(201).json({message:"User registered successfully",user});

    }catch(err){
        res.status(500).json({error:err.message});
    }
};

const login = async (req,res) => {
    try{
        const { userName, password } = req.body;
        const user = await userSchema.findOne({userName});
        if(!user) return res.status(404).json({message:"User not found"});

        const isMatch = password === user.password ? true : false;

        if(!isMatch) return res.status(401).json({message:"Invalid credentials"});

        const token = jwt.sign({userName:user.userName, role: user.role},"Adnan179",{expiresIn:"24h"});
        res.status(201).json({token, role:user.role});
    }catch(err){
        res.status(500).json({error:err.message});
    }
};

module.exports = {register, login};