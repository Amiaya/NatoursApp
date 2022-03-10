const mongoose = require('mongoose')
const fs = require('fs')
const dotenv = require('dotenv')
dotenv.config({path:'./config.env'})
const Tour = require(`./../../models/tourModel`)


const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

const server = mongoose.connect(DB, { 
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify:false,
    useUnifiedTopology: true
 }).then(()=> console.log('DB connection successful!'))

//  Read File
const tour = JSON.parse(fs.readFileSync(`${__dirname}/tours-simple.json`, 'utf-8'))

const importData = async() => {
    try{
        await Tour.create(tour)
        console.log('Data successfully loaded!')
        process.exit()
    }catch(err){
        console.log(err)
    }
}

const deleteData = async() => {
    try{
        await Tour.deleteMany()
        console.log('Data successfully deleted!')
        process.exit()
    }catch(err){
        console.log(err)
    }
}

if(process.argv[2] === '--import'){
    importData()
}
else if(process.argv[2] === '--delete'){
    deleteData()
}