const fs = require('fs')
const Tour = require('../models/tourModel')
const APIFeatures = require('./../utilis/apiFeatures')


exports.aliasTopTours = (req,res,next) => {
    req.query.sort = '-ratingsAverage,price'
    req.query.limit = '5'
    req.query.fields ='name,price,ratingsAverage,summary,difficulty'
    next()
}



 exports.getAllTours = async (req,res) => {
    try{
        // Filtering 
        // const queryObj = {...req.query}
        // const excludedFields = ['sort','page','limit','fields']
        // excludedFields.forEach(el => delete queryObj[el])


        // //Advance filtering
        // let queryStr = JSON.stringify(queryObj) 
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)
    

        // let query = Tour.find(JSON.parse(queryStr))
        
        // Sorting
        // if(req.query.sort){
        //     let sortBy = req.query.sort.split(',').join(' ')
        //     query = query.sort(sortBy)
        // }else{
        //     query = query.sort('-createdAt')
        // }

        //Field limiting
        // if(req.query.fields){
        //     let fields = req.query.fields.split(',').join(' ')
        //     query = query.select(fields)
        // }else{
        //     query = query.select('-__v')
        // }
       
        //Pagination
        // const page = req.query.page * 1 || 1
        // const limit = req.query.limit * 1 || 100
        // const skip = (page - 1) * limit

        // query = query.skip(skip).limit(limit)
        // if (req.query.page){
        //     const numTours = await Tour.countDocuments()
        //     if(skip >= numTours) throw new Error('This page does not exist')
        // }
        
        const features = new APIFeatures(Tour.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()
        const tours = await features.query
        const result = tours.length
        res.status(200).json({
            status:'success',
            result,
            data:{
                tours
            }
        })
    }catch(err){
        res.status(400).json({
            status:'fail',
            message: err
        })
    }
   
}

exports.getTour = async (req,res) => {
    try{
    const tour = await Tour.findById(req.params.id)
    res.status(200).json({
        status:'success',
        data:{
            tour
        }
    }) 
    }catch(err){
        res.status(400).json({
            status:'fail',
            message: err
        })
    }
}

exports.createTour = async (req,res) => {
    try{

        const newTour = await Tour.create(req.body)
        res.status(201).json({
            status:'success',
            data:{
                tour: newTour
            }
        })
    }catch(err){
        res.status(400).json({
            status:'fail',
            message: err
        })
    }
}

exports.updateTour = async(req,res) => {
    try{
        const tour = await Tour.findByIdAndUpdate(req.params.id,req.body, {
            new: true,
            runValidators: true
        })
        res.status(200).json({
            status:'success',
            data:{
                tour
            }
        })
    }catch(err){
        res.status(404).json({
            status:'fail',
            message: err
        })
    }
}

exports.deleteTour = async(req,res) => {
    try{
        await Tour.findByIdAndDelete(req.params.id)
        res.status(204).json({
            status:'success',
            data: null
        })
    }catch(err){
        res.status(404).json({
            status:'fail',
            message: err
        })
    }
}

exports.getTourStats = async(req,res) => {
    try{
        const stats = await Tour.aggregate([
            {
                $match:{ratingsAverage:{$gte: 4.5}}
            },
            {
                $group:{
                    _id: {$toUpper: '$difficulty'},
                    numTours: {$sum: 1},
                    numRatings:{$sum: '$ratingsQuantity'},
                    avgRating:{$avg: '$ratingsAverage'},
                    avgPrice:{$avg: '$price'},
                    minPrice: {$min: '$price'},
                    maxPrice: {$max: '$price'}
                }
            },
            {
                $sort:{avgPrice: 1}
            }
        ])
        res.status(200).json({
            status:'success',
            data:{
                stats
            }
        })
    }catch(err){
        res.status(404).json({
            status:'fail',
            message: err
        })
    }
}

exports.getMonthlyPlan = async(req,res) => {
    try{
        const year = req.params.year * 1
        const plan = await Tour.aggregate([
            {
                $unwind: '$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte: new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`)
                    }
                }
            },
            {
                $group:{
                    _id :{ $month: '$startDates'},
                    numToursStart: {$sum: 1},
                    tours: {$push: '$name'}
                }
            },
            {
                $addFields: {month : '$_id'}
            },
            {
                $project: {
                    _id: 0
                }
            },
            {
                $sort:{numToursStart: -1}
            },
            {
                $limit: 6
            }
        ])

        res.status(200).json({
            status:'success',
            data:{
                plan
            }
        })

    }catch(err) {
        res.status(404).json({
            status:'fail',
            message: err
        })
    }
}