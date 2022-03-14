const mongoose = require('mongoose')
const dotenv = require('dotenv')


process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    console.log("UNCAUGHT EXCEPTION. shuting down the app.....")
        process.exit(1)
})


dotenv.config({path:'./config.env'})

const app = require('./app')
const DB = process.env.DATABASE.replace('<PASSWORD>',process.env.DATABASE_PASSWORD)

mongoose.connect(DB, { 
    useNewUrlParser: true, 
    useCreateIndex: true,
    useFindAndModify:false,
    useUnifiedTopology: true
 }).then(()=> console.log('DB connection successful!'))

const port = 3000 || process.env.PORT
const server = app.listen(port, () => {
    console.log(`Listening to App on port ${port}`)
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log("UNHANDLED REJECTION. shuting down the app.....")
    server.close(() => {
        process.exit(1)
    })
})

