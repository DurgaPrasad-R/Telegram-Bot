const admin = require("firebase-admin");
const { getFirestore} = require('firebase-admin/firestore');
const request = require('request');
const TelegramBot = require('node-telegram-bot-api');
const token = 'token_here';
const bot = new TelegramBot(token,{polling:true});


var serviceAccount = require("./key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = getFirestore();

bot.on('message',function(msg){
    const mg = msg.text;

    const newMsg = mg.split(" ")
    if(newMsg[0] == '/start'){
        bot.sendMessage(msg.chat.id,"Enter an author name");
    }
    else if(newMsg[0]=='/history'){
        //Get the data from database with keys
        db.collection('Books').where('userID', '==', msg.from.id).get().then((docs)=>{
          docs.forEach((doc) => {
                bot.sendMessage(msg.chat.id, "Author:"+ doc.data().Author + "\n" + "Title:"+doc.data().Title+ "\n" + "Publish Year: "+doc.data().Publish_Year+ "\n"+"Publisher:"+doc.data().Publisher);
              });
        })
    }
    else{
        request('https://openlibrary.org/search.json?author='+msg.text+'&sort=new',function(error,response,body){
            if(JSON.parse(body).docs.length > 0){
                const publishYear = JSON.parse(body).docs[0].first_publish_year;
                const publishYearValue = (publishYear > 2023) ? "NA" : publishYear;
                const author = JSON.parse(body).docs[0].author_name[0];
                const title = JSON.parse(body).docs[0].title;
                const publisher = JSON.parse(body).docs[0].publisher_facet[0];
                db.collection('Books').add({
                    userID:msg.from.id,
                    Author: author,
                    Title: title,
                    Publish_Year: publishYearValue,
                    Publisher: publisher
                })
                bot.sendMessage(msg.chat.id,"Author:"+ author + "\n" + "Title:"+title+ "\n" + "Publish Year: "+publishYearValue+ "\n"+"Publisher:"+publisher)
            }
            else{
                db.collection('Books').add({
                    Error: "Please Provide Proper Author Name"
                })
                bot.sendMessage(msg.chat.id,"Please provide a valid author name");
            }
        });
    }
});
