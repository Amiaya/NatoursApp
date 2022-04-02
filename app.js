const exp = require('constants')
const express = require('express')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')
const hpp = require('hpp')

const morgan = require('morgan')

// Global Middleware
const app = express()


// set security HTTP header
app.use(helmet())


// development loggin
console.log(process.env.NODE_ENV)
if(process.env.NODE_ENV === 'development'){
    app.use(morgan('dev'))   
}


// limit request from the same API
const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, please try again in an hour!'
})

app.use('/api', limiter)


// body paser
app.use(express.json({limit: '10kb'}))
app.use(express.static(`${__dirname}/public`))


// Data sanitization against NoSQL query injection
app.use(mongoSanitize())


// Data sanitization against XSS
app.use(xss())

// Prevent data pollution
app.use(hpp({
    whitelist: ['duration','ratingsQuantity','ratingsAverage', 'maxGroupSize','difficulty','price']
}))



// app.use((req,res,next) => {
//     req.requestTime = new Date().toString()
//     console.log(req.headers)
//     next()
// })
const AppError = require('./utilis/appError')
const errorController = require('./controllers/errorController')

const tourRouter = require('./routes/tourRouter')
const userRouter = require('./routes/userRouter')



app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)

app.all('*', (req,res,next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`,400))
})

app.use(errorController)

module.exports = app