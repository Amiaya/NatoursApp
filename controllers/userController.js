const User = require('../models/userModel')
const catchAsync = require('./../utilis/catchAsync')
const AppError = require('./../utilis/appError')



const filterObj = (obj, ...allowedFields) => {
    const newObj = {}
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) newObj[el] = obj[el]
    })
    return newObj
}

exports.getAllUsers = catchAsync(async (req,res,next) => {
    const users = await User.find()
    res.status(200).json({
        status:'success',
        data:{
            users
        }
    })
})
exports.updateMe = catchAsync( async (req,res, next) => {
    // 1) Create an error if a user POSTs a password data
    if(req.body.password || req.body.passwordConfirm){
        return next(new AppError("This route is not for update password. Please use /updateMyPassword route"))
    }

    // 2) filtered out unwanted fields name 
    const filterBody = filterObj(req.body, 'name', 'email')


    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user._id,filterBody, {
        runValidators: true,
        new: true
    })
    res.status(200).json({
        status: "success",
        data: {
            user: updatedUser
        }
    })
})

exports.deleteMe = catchAsync(async (req,res,next) => {
    await User.findByIdAndUpdate(req.user._id, {active: false})

    res.status(204).json({
        status: 'success',
        data: null
    })
})
exports.getUser = (req,res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined",

    })
}

exports.createUser = (req,res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined",

    })
}

exports.updateUser = (req,res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined",

    })
}

exports.deleteUser = (req,res) => {
    res.status(500).json({
        status: "Error",
        message: "This route is not yet defined",

    })
}
