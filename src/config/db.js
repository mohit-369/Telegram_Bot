
const mongoose=require('mongoose');

const mongoconnect=async ()=>{
    return  await mongoose.connect(process.env.MONGO_URL);
}

module.exports=mongoconnect;