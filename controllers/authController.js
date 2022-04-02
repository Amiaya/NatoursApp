const crypto = require('crypto')
const { promisify } = require('util')
const jwt = require('jsonwebtoken')
const User = require('./../models/userModel')
const catchAsync = require('./../utilis/catchAsync')
const AppError = require('./../utilis/appError')
const sendEmail = require('./../utilis/email')



const signToken = id => {
    return jwt.sign({id}, process.env.JWT_SECRET,{
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)

    const cookieOptions =  {
        expires: new Date(
            Date.now()+ process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ), 
        httpOnly: true
        
    }
    if(process.env.NODE_ENV === 'production' ) cookieOptions,secure = true

    res.cookie('jwt', token,cookieOptions)

    user.password = undefined
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}
exports.signup = catchAsync(async(req,res,next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangeAt: req.body.passwordChangeAt
    })

    createSendToken(newUser,201, res)
})

exports.login = catchAsync(async (req,res,next) => {
    const{email,password} = req.body
    // (1) check if the password and email exist
    if(!email || !password){
        return next(new AppError('Please provide email and password', 400)) 
    }

    // (2) check if the user exists and password is correct
    const user = await User.findOne({ email }).select('+password')
     

    if(!user || !await user.correctPassword(password, user.password)){
        return next(new AppError('Incorrect password or username', 401))
    }

    // (3) if everything is okay, then send the token to the client
    createSendToken(user,200, res)
})

exports.protect = catchAsync(async (req,res,next) => {
    // 1 Getting the token
    let token
    if(req.headers.authorization &&  req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1]
    }
    
    if(!token){
        return next(new AppError('You are not logged in, Please log in to get access', 401))
    }

    // 2 verification of the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)


    // 3 check if the user still exist
    const currentUser = await User.findById(decoded.id)
    if(!currentUser){
        return next(new AppError('The user belonging to this token, no longer exist',401))
    }

    // 4 check if the user change password after the token was issue
    if(currentUser.changePasswordAfter(decoded.iat)){
        return next(new AppError('User recently change the password, Please login again',401))
    }

    req.user = currentUser
    next()
})

exports.restrictTo = (...roles) => {
    return (req,res,next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403))
        }
        next()
    }
}

exports.forgotPasword =catchAsync( async(req,res,next) => {
    // 1 Get user based on Posted email
    const user = await User.findOne({email: req.body.email})
    if(!user) {
        return next(new AppError('There is no user with this email', 404))
    }
    // 2 Generate random reset token
    const resetToken = user.createPasswordResetToken()
    await user.save({validateBeforeSave: false})
    // 3 send it to users email
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`

    const message = `Forgot password submit a PATCH request with your new password and confirmed password to: ${resetURL}
    .\n if you didn't forget your password, please ignore this email`


    try{
        sendEmail({
            email: user.email,
            subject: 'Your password reset token(valid for 10mins)',
            message
        })
    
        res.status(200).json({
            status: 'success',
            message: 'Token sent to email'
        })
    }catch(err){
        user.passwordResetToken = undefined
        user.passwordResetExpire = undefined
        await user.save({validateBeforeSave: false})

        return next(new AppError('There was an error sending the email, try again later', 500))
    }
    
})

exports.resetPasword =catchAsync(async (req,res,next) => {
    // 1) Get user base on token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')
    
    const user = await User.findOne({passwordResetToken: hashedToken, passwordResetExpire: {$gt: Date.now()}})

    // 2) if token has not expired and there is a user, set new password
    if(!user){
        return next(new AppError('Token is invalid or has expired', 400))
    }
    user.password = req.body.password
    user.passwordConfirm  = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpire = undefined
    await user.save()

    // 3) Update changePasswordAt property for use
    //4) log the user in and send JWT
    createSendToken(user,200, res)
    
})

exports.updatePassword = catchAsync(async(req,res,next) => {
    // 1) Get users collection
    const user = await User.findById(req.user.id).select('+password')
    const { passwordConfirm, password, passwordCurrent} = req.body
    
    // 2) Check if the Posted current password is correct
    if(!await user.correctPassword(passwordCurrent, user.password)){
        return next(new AppError('incorrect password', 404))
    } 

    // 3) if so, Update password
    user.password = password
    user.passwordConfirm = passwordConfirm
    await user.save()

    // 4) log user in, send JWT
    createSendToken(user,200, res)
})