const exp = require('constants')
const express = require('express')

const morgan = require('morgan')

const app = express()
app.use(express.json())
console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))   
}
app.use(express.static(`${__dirname}/public`))

const tourRouter = require('./routes/tourRouter')
const userRouter = require('./routes/userRouter')



app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)


module.exports = app