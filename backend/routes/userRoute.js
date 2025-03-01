const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Users = require("../models/userSchema");

const SECRET_KEY = "Adnan179";

const authenticate = (req,res,next) => {
    const token = req.header("Authorization")?.split(" ")[1];
    if(!token) return res.status(401).json({error:"Access denied!"});

    try{
        const verified = jwt.verify(token, SECRET_KEY);
        req.user = verified;
        console.log("Authenticated User:", req.user);
        next();
    }catch(err){
        res.status(400).json({error:"Invalid token!"});
    }
};

const isAdmin = (req,res,next) => {
    if(req.user.role !== "admin") return res.status(403).json({error:"Access denied"});
    next();
};

router.post("/add-admin", async(req,res) => {
    try{ 
        const {userName, password} = req.body;
        const newUser = new Users({userName, password, role:"admin"});
        await newUser.save();
        res.status(200).json({message:"Admin added successfully",newUser})
    }catch(err){
        res.status(500).json({error:err.message});
    }
});
router.delete("/admin/:adminName", async(req,res) =>{
    try{
        const {adminName} = req.params;
        await Users.findOneAndDelete({userName:adminName});
        res.status(200).json({message:"Admin deleted successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});
router.post("/add-operator", authenticate,isAdmin, async(req,res) => {
    try{
        const {userName, password} = req.body;
        const newUser = new Users({userName, password, role:"operator"});
        await newUser.save();

        res.status(200).json({message:"Operator added successfully"})
    }catch(err){
        res.status(500).json({error:err.message});
        console.log("error adding operator",err.message)
    }
});

router.get("/operators", authenticate, isAdmin, async(req,res) => {
    try{
        const operators = await Users.find({role:"operator"});
        if(!operators) return res.status(404).json({error:"No operators found!"});
        res.status(200).json(operators);
    }catch(err){
        res.status(500).json({error:err.message});
        console.log(err.message);
    }
});

router.put("/operator/:operatorName", authenticate, isAdmin, async (req,res) => {
    try{
        const updatedOperator = await Users.findOneAndUpdate({userName:req.params.operatorName}, req.body,{new:true, runValidators:true});
        if(!updatedOperator) return res.status(404).json({error:"Operator not found!"});
        res.status(200).json({message:"Operator updated successfully", updatedOperator});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

router.delete("/operator/:operatorName", authenticate, isAdmin, async (req,res) => {
    try{
        const deletedOperator = await Users.findOneAndDelete({userName:req.params.operatorName});
        if(!deletedOperator) return res.status(404).json({error:"Operator not found!"});
        res.status(200).json({message:"Operator deleted successfully"});
    }catch(err){
        res.status(500).json({error:err.message});
    }
});

module.exports = router;