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

/* GET all courses
 GET /api/courses 200
 */
router.get('/', asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll().then(function(courses){
        console.log(courses);
        res.json(courses);
    });
}));

/*
Return the course for the provided ID
GET /api/courses/:id 200
 */
router.get('/:id', asyncHandler(async (req, res, next) => {

}));

/*
Creates a new course
POST /api/courses 201
 */
router.post('/');

/*
Updates a course
PUT /api/courses/:id 204
 */
router.put('/:id');

/*
delete the course with a provided ID
DELETE /api/courses/:id 204
 */
router.delete('/:id');

module.exports = router;
