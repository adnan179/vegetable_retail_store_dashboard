const jwt = require("jsonwebtoken");
const express = require("express");
const User = require("../models/userSchema");
const router = express.Router();
const SECRET_KEY = "Adnan179";


router.post("/login", async(req,res) => {
    try{
        const { userName, password} = req.body;
        const user = await User.findOne({userName, password});
        if(!user) return res.status(400).json({error:"Invalid credentials!"});
        const tokenPayload = { id: user._id, role: user.role };
        console.log("Token Payload:", tokenPayload); // Debugging log
        const token = jwt.sign({id:user._id, role:user.role}, SECRET_KEY, {expiresIn:"12h"});
        res.status(200).json({token,userName:user.userName, role:user.role});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

module.exports = router;