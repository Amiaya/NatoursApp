const AppError = require('./../utilis/appError')


const handleCastErrorDB = err => {
    const message = `invalid ${err.path}: ${err.value}`
    return new AppError(message,400)
}
const handleDuplicateFieldDB = err => {
    const value = err.keyValue.name
    console.log(value)
    const message = `Duplicate field value: ${value}. Please use another name`
    return new AppError(message,400)

}
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el=> el.message)
    const message = `Invalid input data. ${errors.join('. ')}`
    return new AppError(message,400)
}

const handleJWTError = ()=> new AppError('invalid token, Please login again', 401)


const handleJWTExpiredError = ()=> new AppError('Your token has expired, pleaselogin again', 401)

const sendErrorDev = (err,res) => {
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    })
}

const sendErrorProd = (err,res) => {
    if(err.isOperational){
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            
        })
    }else{
        console.error('Error', err)
        res.status(500).json({
            status: "error",
            message: "Something went wrong"
        })
    }
    
}
module.exports = (err,req,res,next) => {
    err.statusCode = err.statuscode || 500
    err.status = err.status || 'error'

    if(process.env.NODE_ENV === 'development'){
          sendErrorDev(err,res)
    }else if(process.env.NODE_ENV === 'production'){
        
        let error = { ...err }
        if(err.name === 'CastError') err = handleCastErrorDB(err)
        if (err.code === 11000) err = handleDuplicateFieldDB(err)
        if(err.name === 'ValidationError') err = handleValidationErrorDB(err)
        if(err.name === "JsonWebTokenError") err = handleJWTError()
        if(err.name === "TokenExpiredError") err = handleJWTExpiredError()
        sendErrorProd(err,res)
    }
}