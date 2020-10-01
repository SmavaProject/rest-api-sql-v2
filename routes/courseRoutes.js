const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const Sequelize = require('sequelize');
const User = require('../models').User;
const Course = require('../models').Course;



/* Handler function to wrap each route. */
function asyncHandler(cb){
    return async(req, res, next) => {
        try {
            await cb(req, res, next)
        } catch(error){
            next(error);
        }
    }
}

/* GET all courses */
router.get('/', asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll().then(function(courses){
        console.log(courses);
        res.json(courses);
    });
}));

module.exports = router;
