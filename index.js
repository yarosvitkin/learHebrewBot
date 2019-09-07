const TelegramBot = require('node-telegram-bot-api');
const token = '903641084:AAHoci3DZKNfiRlHwIMzvh2OnGDO3LbHbDA';
const bot = new TelegramBot(token, { polling: true });
var mongo = require('mongodb');
const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/words";
var cron = require('node-cron');



let word = {
    hebrew: '',
    russian: '',
    isLearned: false
}
let afterTimerKeyboard = {
    reply_markup: {
        keyboard: [
            [
                'Слово выучено 🧠'
            ],
            [
                'Повторить 🔁'
            ],
            [
                'Назад 🔙'
            ]
        ]
    }

}
let setTimeKeyboard = {
    reply_markup: {
        keyboard: [
            [
                '8:00', '9:00', '10:00', '11:00'
            ],
            [
                '12:00', '13:00', '14:00', '15:00'
            ],
            [
                '16:00', '17:00', '18:00', '19:00'
            ],
            [
                '20:00', '21:00', '22:00', '23:00'
            ],
            [
                'Назад 🔙'
            ]
        ]
    }
}
let timesArr = [
    '8:00', '9:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00', '23:00'
]
let keyboard = {
    reply_markup: {
        keyboard: [
            [
                'Добавить слово и перевод ✏️'
            ],
            [
                'Показать невыученные слова 🗄'
            ],
            [
                'Установить напоминание ⏰'
            ]
        ]
    }
}
var WordId = {};
var Achivement = {
    count: 0
};



bot.onText(/\/start/, msg => {
    let chatId = msg.chat.id;
    let collectionName = msg.from.first_name + '_' + msg.from.last_name;
    //Creating a new collection 
    MongoClient.connect(url, function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.createCollection(collectionName, function(err, res) {
            if (err) throw err;
            console.log(`Collection ${collectionName} created!`);
            db.close();
        });




    });
    bot.sendMessage(chatId, 'Шалом 👋 , что вы хотите сделать?', keyboard)
})


bot.on('message', msg => {
    let collectionName = msg.from.first_name + '_' + msg.from.last_name;
    console.log('Now you listening the message')
    let data = msg.text;
    let isHebrew = data.search(/[\u0590-\u05FF]/);
    let isRussin = data.search(/[А-яЁё]/);

    let commands = [
        'Добавить слово и перевод ✏️',
        'Показать невыученные слова 🗄',
        '/start',
        'Установить напоминание ⏰',
        'Назад 🔙',
        'Слово выучено 🧠',
        'Повторить 🔁'
    ]


    if (isHebrew >= 0) {
        word.hebrew = data.split('').reverse().join('')
        console.log(word)
        bot.sendMessage(msg.chat.id, 'Введите перевод слова на русском')
    }


    if (commands.includes(data) == false &&
        isHebrew < 0 &&
        isRussin >= 0 &&
        !timesArr.includes(data)) {
        word.russian = data
        console.log(word)

        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            var myobj = {
                hebrew: word.hebrew,
                russian: word.russian,
                isLearned: false
            };
            dbo.collection(collectionName).insertOne(myobj, function(err, res) {
                if (err) throw err;
                console.log("Document inserted");
                db.close();
            });
        });
        bot.sendMessage(msg.chat.id, 'Слово добавлено', keyboard)
    }
    ////// Adding reminder time 
    if (timesArr.includes(data)) {

        let hours = parseFloat(data)
        console.log(hours)
        MongoClient.connect(url, function(err, db) {
            if (err) throw err;
            var dbo = db.db("mydb");
            dbo.collection(collectionName).find({}).toArray(function(err, result) {
                if (err) throw err;
                bot.sendMessage(msg.chat.id, `Напоминание на ${hours}:00 установлено`, keyboard)
                cron.schedule(`00 ${hours} * * *`, () => {
                    let notLearnedWords = [];
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].isLearned == false) {
                            notLearnedWords.push(result[i])
                        }
                    }
                    let randomNumber = Math.floor(Math.random() * notLearnedWords.length)
                    WordId.id = notLearnedWords[randomNumber]._id;
                    WordId.translate = notLearnedWords[randomNumber].russian;
                    console.log(notLearnedWords[randomNumber])
                    bot.sendMessage(msg.chat.id,
                        notLearnedWords[randomNumber].hebrew.split('').reverse().join('') + '-' + notLearnedWords[randomNumber].russian,
                        afterTimerKeyboard)
                });
                db.close();
            });
        });
    }

    switch (data) {
        case 'Добавить слово и перевод ✏️':
            bot.sendMessage(msg.chat.id, 'Введите слово на иврите')
            break;

        case 'Показать невыученные слова 🗄':
            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mydb");
                dbo.collection(collectionName).find({}).toArray(function(err, result) {
                    if (err) throw err;
                    for (let index = 0; index < result.length; index++) {
                        if (result[index].isLearned == false) {
                            let html = `<strong>${result[index].hebrew.split('').reverse().join('')+"-"+result[index].russian}</strong>`
                            bot.sendMessage(msg.chat.id, html, {
                                parse_mode: 'HTML'
                            })


                        }
                    }
                    db.close();
                });

            });
            break;
        case 'Установить напоминание ⏰':
            bot.sendMessage(msg.chat.id, 'Выберите время получения уведомлений', setTimeKeyboard)

            break;
        case 'Назад 🔙':
            bot.sendMessage(msg.chat.id, 'Назад 🔙', keyboard)
            break;

        case 'Слово выучено 🧠':

            MongoClient.connect(url, function(err, db) {
                if (err) throw err;
                var dbo = db.db("mydb");
                var myquery = {
                    _id: WordId.id
                };
                var newvalues = { $set: { isLearned: true } };
                dbo.collection(collectionName).updateOne(myquery, newvalues, function(err, res) {
                    if (err) throw err;
                    console.log(`Слово ${WordId.translate} выучено`);
                    db.close();
                });

                dbo.collection(collectionName).find({}).toArray(function(err, result) {
                    if (err) throw err;
                    for (let i = 0; i < result.length; i++) {
                        if (result[i].isLearned == true) {
                            Achivement.count++
                        }
                    }

                    switch (Achivement.count) {
                        case 5:
                            bot.sendMessage(msg.chat.id, `Ура, ты выучил уже 5 слов🤓`)
                            break;
                        case 10:
                            bot.sendMessage(msg.chat.id, `Ура, ты выучил уже 10 слов🤓`)
                            break;
                        case 20:
                            bot.sendMessage(msg.chat.id, `Ура, ты выучил уже 20 слов🤓`)
                            break;
                        case 50:
                            bot.sendMessage(msg.chat.id, `Ура, ты выучил уже 50 слов🤓`)
                            break
                        default:
                            break;
                    }


                    //bot.sendMessage(msg.chat.id, `Вы выучили уже ${Achivement.count} слов`)
                    db.close();
                });
            });
            break;
        default:
            break;
    }
})



// Creating a new database for words
// MongoClient.connect(url, function(err, db) {
//     if (err) throw err;
//     console.log("Database created!");
//     db.close();
// });
// cron.schedule('50 16 * * *', () => {
//     console.log('running a task every sec');
// });