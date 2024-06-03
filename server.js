// always write command above the text
require('dotenv').config();
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

const {Telegraf}=require('telegraf');

// import message from 'telegraf/filters';

const { message } = require('telegraf/filters')

const Groq = require("groq-sdk");

const userModel=require('./src/models/User');

const mongoconnect=require('./src/config/db');

const bot= new Telegraf(process.env.BOT_TOKEN);



const groq = new Groq({
    apiKey:process.env.CHAT_KEY,
});

const eventModel=require('./src/models/Events');

try {

    mongoconnect();
    console.log('MongoDb Connected');
    
} catch (error) {

    console.log(error);
    process.kill(process.pid,'SIGTERM');
    
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });




bot.start(async(ctx)=>{

    const from=ctx.update.message.from;
    console.log('userdetail',from);

    // store the user information in db

    try {

        await userModel.findOneAndUpdate({tgId:from.id},{
            $setOnInsert:{
                firstName:from.first_name,
                lastName:from.last_name,
                isBot:from.is_bot,
                userName:from.username,
            }
        },{upsert:true,new:true});

        await ctx.reply(`Hey "${from.first_name}"  Welcome to My Bot "Post Writer" `);
        
    } catch (error) {


        console.log('error in connecting',error);

        await ctx.reply('Facing Difficulties In backend');
        
    }


    

})



bot.command('generate',async(ctx)=>{

    const from=ctx.update.message.from;

    const {message_id:waitingMessageId}=await ctx.reply(`Hey ${from.first_name},Kindly wait for a moment.I am curating posts for you.`)

    const {message_id:stickerId}=await ctx.replyWithSticker('CAACAgIAAxkBAAOFZl1mCrJpKz48MpafPWg3YYgKGBQAAq0AA8GcYAzYksbaxKE_ajUE');

    console.log('message',waitingMessageId);

    const startofTheDay=new Date();

    const endofTheDay=new Date();

    startofTheDay.setHours(0,0,0,0);

    endofTheDay.setHours(23,59,59,999);

    // get events

    const events=await eventModel.find({
        tgId:from.id,
        createdAt:{
            $gte:startofTheDay,
            $lte:endofTheDay,
        },
    })

    if(events.length===0){

        await ctx.deleteMessage(waitingMessageId);

        await ctx.deleteMessage(stickerId);

            await ctx.reply('No events today');

            return ;
    }

    // console.log('evetns:',events);

    try {

        const chatCompletion=await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "Act as a senior copywriter,you write highly engaging posts for linkedin, facebook and twitter using provided thought/events throught the day"
                },
                {
                    role:'user',
                    content:`write like a human.Craft three engaging social media posts tailored for Linkedin,Facebook and twitter audiences.Use single language .Use given time labels just to understand the order of the event ,do not mention the time in the posts.Each post should creatively highlight the following events.Ensure the tone is conversational and impactful.Focus on engaging the respective platform audience ,encouraging interaction  and driving interest in the events:
                    ${events.map((event)=>event.text).join(', ')}`

                }
            ],
            model: process.env.CHAT_MODEL
        });

        console.log('completion',chatCompletion.choices[0].message);
        await ctx.deleteMessage(waitingMessageId);
        await ctx.deleteMessage(stickerId);
        await ctx.reply(chatCompletion.choices[0].message.content);
        
    } catch (err) {

        console.log('error',err);
        
    }




    

    // store
})

// bot.on(message('sticker'),async(ctx)=>{
//     const from =ctx.update.message.sticker;
//     console.log('from',from);
//     await ctx.reply('Your stiker saved');
// })

bot.on(message('text'),async(ctx)=>{

    const from=ctx.update.message.from;

    const message=ctx.update.message.text;
    console.log('ctx',from); 
    try {

        await eventModel.create({
            text:message,
            tgId:from.id,
        })

        console.log('Message Saved Succesfully in Database');

        await ctx.reply('Got your message and type /generate to generate event');


        
    } catch (err) {

        console.log(err);

        await ctx.reply('Please try later');
        
    }
    
})

bot.launch();




// Enable graceful stop

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
