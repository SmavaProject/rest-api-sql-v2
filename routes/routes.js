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
    try {
        const currentUser = req.currentUser;
        console.log(currentUser);
        if (currentUser) {
            res.json({
                id: currentUser.id,
                firstName: currentUser.firstName,
                lastName: currentUser.lastName,
                emailAddress: currentUser.emailAddress
            });
        } else {
            res.status(404);
        }
    }catch (error){
        console.log(error);
    }
}));


/*
Creates a new user
POST /api/users 201
 */

router.post('/users', [
    check('firstName')
        .exists()
        .withMessage('Please provide a value for "firstName"'),
    check('lastName')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "emailAddress"'),
    check('emailAddress')
        .isEmail()
        .withMessage('Please a valid email address'),
    check('password')
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage('Please provide a value for "password"'),
], asyncHandler(async (req, res, next) => {
    try {
        console.log(req.body);
        const errors = validationResult(req);
        console.log(errors);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({errors: errorMessages});
        } else {
            const currentUser = req.body;

            //check whether it is a new user or whether such email address already exists in the DB
            const allUsers = await User.findAll({attributes: ["emailAddress"], raw: true});
            console.log(allUsers);
            const allUserEmails = allUsers.map(user => user.emailAddress);
            const emailOfCurrentUser = allUserEmails.find(email => email === currentUser.emailAddress);

            if (currentUser.emailAddress === emailOfCurrentUser) {
                return res.status(400).json({error: "User with such email address already saved in the database"});
            }

            //hashing the password
            currentUser.password = bcryptjs.hashSync(currentUser.password);
            //saving user to the DB
            await User.create(currentUser); //req.body
            res.status(201).location(`/`).end();
        }
    } catch (error){
        console.log(error);
    }
}));


/*****************
** COURSE ROUTES **
 *****************/


/* GET all courses
 GET /api/courses 200
 */
router.get('/courses', asyncHandler(async (req, res, next) => {
    try {
        const courses = await Course.findAll({
            include: {
                model: User,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            },
            attributes: {exclude: ['createdAt', 'updatedAt']}
        });
        res.json(courses);
    }catch (error){
        console.log(error);
    }
}));

/*
Return the course for the provided ID
GET /api/courses/:id 200
 */
router.get('/courses/:id', asyncHandler(async (req, res, next) => {
    try {
        const courses = await Course.findAll({ // Course.findByPk -????
            include: {
                model: User,
                as: "user",
                attributes: ["id", "firstName", "lastName", "emailAddress"]
            },
            attributes: {exclude: ['createdAt', 'updatedAt']}
        });

        const id = req.params.id;
        const course = courses.find(course => course.id == id);
        if (course) {
            res.json(course);
        } else {
            res.status(400).json({message: `Course ID ${id} is not found`});
        }
    }catch (error){
        console.log(error);
    }
}));

/*
Creates a new course
POST /api/courses 201
 */

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
], authenticateUser, asyncHandler(async(req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({errors: errorMessages});
        }
        //adding course to the DB
        const newCourse = await Course.create(req.body);
        const courseId = newCourse.dataValues.id;

        res.status(201).location(`/courses/${courseId}`).end();
    }catch (error){
        console.log(error);
    }
}));

/*
Updates a course
PUT /api/courses/:id 204
 */
router.put('/courses/:id', [
    check("title")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage("Please provide value from 'title'"),
    check("description")
        .exists({ checkNull: true, checkFalsy: true })
        .withMessage("Please provide value for 'description'")
], authenticateUser, asyncHandler(async(req, res, next) => {
    try {
        const errors = validationResult(req);
        console.log(errors);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({errors: errorMessages});
        }

        const user = req.currentUser;
        const courseID = req.params.id;
        const course = await Course.findByPk(courseID);

        if (course) { //make sure that the course is found
            if (user.id == course.userId) {
                await course.update(req.body);
                res.sendStatus(204);
            } else {
                res.status(403).json({message: 'Access Denied'});
            }
        }else{
            res.status(400).json({message: `Course ID ${courseID} is not found`});
        }
    }catch (error){
        console.log(error);
    }
}));

/*
delete the course with a provided ID
DELETE /api/courses/:id 204
 */
router.delete('/courses/:id', authenticateUser, asyncHandler(async(req, res, next) => {
    try {
        const user = req.currentUser;
        const course = await Course.findByPk(req.params.id);

        if (user.id == course.userId) {
            await course.destroy();
            res.sendStatus(204);
        } else {
            res.status(403).json({ message: 'Access Denied' });
        }
    }catch (error){
        console.log(error);
    }
}));

module.exports = router;
