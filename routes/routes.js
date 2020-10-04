const express = require('express');
const morgan = require('morgan');
const router = express.Router();
const Sequelize = require('sequelize');
const User = require('../models').User;
const Course = require('../models').Course;
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');

/* Handler function to wrap each route. */
function asyncHandler(cb){
    return async(req, res, next) => {
        try {
            await cb(req, res, next)
        } catch(error){
            next(error);
        }
    }
};

const authenticateUser = async (req, res, next) => {
    let message = null;

    //get credentials from Authorization header
    const credentials = auth(req);

    if (credentials) {
        // getting all users from the DB and finding one which has the credentials from header

        const users = await User.findAll();
        const user = users.find(user => user.emailAddress === credentials.name);

        if (user) {
            // compare password from the header and from the DB
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);

            // If the passwords match...
            if (authenticated) {
                console.log(`Authentication successful for username: ${user.firstName} ${user.lastName}`);

                // Then store the retrieved user object on the request object
                // so any middleware functions that follow this middleware function
                // will have access to the user's information.
                req.currentUser = user;
            } else {
                message = `Authentication failure for username: ${user.firstName} ${user.lastName}`;
            }
        } else {
            message = `User not found for username: ${credentials.name}`;
        }
    } else {
        message = 'Auth header not found';
    }

    // If user authentication failed...
    if (message) {
        console.warn(message);

        // Return a response with a 401 Unauthorized HTTP status code.
        res.status(401).json({ message: 'Access Denied' });
    } else {
        // Or if user authentication succeeded...
        // Call the next() method.
        next();
    }
};


/***************
** USER ROUTES **
 ***************/

/*
Returns the currently authenticated user
GET /api/users 200
 */
router.get('/users', authenticateUser, asyncHandler(async (req, res, next) => {
    const currentUser = req.currentUser;
    if (currentUser){
        res.json({
            firstName: authedUser.firstName,
            lastName: authedUser.lastName,
            emailAddress: authedUser.emailAddress
        });
    }else{
        res.status(404);
    }
}));


/*
Creates a new user
POST /api/users 201
 */

router.post('/users', [
    check('firstName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "firstName"'),
    check('lastName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "emailAddress"'),
    check('password')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "password"'),
], asyncHandler(async (req, res, next) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Use the Array `map()` method to get a list of error messages.
        const errorMessages = errors.array().map(error => error.msg);

        // Return the validation errors to the client.
        return res.status(400).json({ errors: errorMessages });
    }else {
        const user = req.body;
        //user = await User.create(req.body);
        res.status(201).end();
    }
}));


/*****************
** COURSE ROUTES **
 *****************/


/* GET all courses
 GET /api/courses 200
 */
router.get('/courses', asyncHandler(async (req, res, next) => {
    const courses = await Course.findAll().then(function(courses){
        console.log(courses);
        res.json(courses);
    });
}));

/*
Return the course for the provided ID
GET /api/courses/:id 200
 */
router.get('/courses/:id', asyncHandler(async (req, res, next) => {

}));

/*
Creates a new course
POST /api/courses 201
 */
/*
router.post('/',  [
    check("title")
        .exists()
        .withMessage("Please provide value from 'title'"),
    check("description")
        .exists()
        .withMessage("Please provide value for 'description'"),
    check("userId")
        .exists()
        .withMessage("Please provide value for 'userId'")
], userRoutes.authenticateUser, asyncHandler(async (req, res, next) => {

}));
*/


//POST /COURSES
router.post('/courses', [
    check("title")
        .exists()
        .withMessage("Please provide value from 'title'"),
    check("description")
        .exists()
        .withMessage("Please provide value for 'description'"),
    check("userId")
        .exists()
        .withMessage("Please provide value for 'userId'")
], authenticateUser, asyncHandler(async(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        return res.status(400).json({ errors: errorMessages });
    };
    const course = req.body;
//ADD COURSE TO DATABASE
    const newCourse = await Course.create(course);
    const courseId = newCourse.dataValues.id
//STATUS 201
    res.status(201).location(`/courses/${courseId}`).end();
}));
/*
Updates a course
PUT /api/courses/:id 204
 */
router.put('/courses/:id');

/*
delete the course with a provided ID
DELETE /api/courses/:id 204
 */
router.delete('courses/:id');

module.exports = router;
