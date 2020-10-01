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

/*
Returns the currently authenticated user
GET /api/users 200
 */
router.get('/',  asyncHandler(async (req, res, next) => {
    const users = await User.findAll().then(function(users){
        console.log(users);
        res.json(users);
        res.status(200).end();
    });
}));


/*
Creates a new user
POST /api/users 201
 */
router.post('/',  asyncHandler(async (req, res, next) => {

    const user = req.body();
    if (user){

    }
    res.status(201).end();
}));

module.exports = router;
