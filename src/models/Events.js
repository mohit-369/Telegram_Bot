
const mongoose=require('mongoose');

const eventSchema=new mongoose.Schema({
    text:{
        type:String,
        required:true,
    },
    tgId:{
        type:String,
        required:true,
    }
},{timestamps:true});


const Event=new mongoose.model('Event',eventSchema);

module.exports=Event;