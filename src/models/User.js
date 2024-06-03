const { Timestamp } = require('bson');
const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
    tgId:{
        type:String,
        required:true,
        unique:true
    },
    firstName:{
        type:String,
        required:true,
    },
    lastName:{
        type:String,
        required:true
    },
    isBot:{
        type:Boolean,
        required:true,
    },
    userName:{
        type:String,
        required:true,
        unique:true,
    },

},{timestamp:true});

const User=new mongoose.model("User",userSchema);

module.exports=User