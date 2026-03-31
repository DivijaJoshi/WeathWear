const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');




const signup = async (req, res, next) => {
    try {

        //if request body empty throw error
        if (!req.body) {
            const error = new Error('Missing fields');
            error.code = 400;
            throw error;
        }

        const { name, email, password, gender } = req.body;

        //check for required fields
        if (!name || !email || !password || !gender) {
            const error = new Error('name, email, password, gender are required');
            error.code = 400;
            throw error;
        }

        //check for extra fields
        const allowedFields = ['name', 'email', 'password', 'gender'];
        for (const key in req.body) {
            if (!allowedFields.includes(key)) {
                const error = new Error('Only name, email, password, gender are allowed');
                error.code = 400;
                throw error;
            }


        }

        //validate gender
        const allowedGenders = ['male', 'female'];
        if (!allowedGenders.includes(gender)) {
            const error = new Error('Gender must be male or female');
            error.code = 400;
            throw error;
        }

        //check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const error = new Error('Email already exists');
            error.code = 400;
            throw error;
        }


        if (password.length < 8) {
            const error = new Error('Password must be at least 8 characters long');
            error.code = 400;
            throw error;
        }
        //hash password 
        const hashedPassword = await bcrypt.hash(password, 10);

        //create new user
        await User.create({ name, email, password: hashedPassword, gender });

        res.status(201).json({ success: true, message: 'Sign up successful' });



    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {

    try {

        //check if request body is empty
        if (!req.body) {
            const error = new Error('Missing fields');
            error.code = 400;
            throw error;

        }

        const { email, password } = req.body;

        //check for required fields
        if (!email || !password) {
            const error = new Error('email,password are required');
            error.code = 400;
            throw error;
        }


        //check for extra fields in req.body
        const allowedFields = ['email', 'password'];
        for (const key in req.body) {
            if (!allowedFields.includes(key)) {
                const error = new Error('Only email, password are allowed in request body');
                error.code = 400;
                throw error;
            }
        }


        //Check if user exists by email or credentials are invalid
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Invalid Credentials');
            error.code = 401;
            throw error;
        }

        //verify if password matches the stored password in db
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched) {
            const error = new Error('Invalid Credentials, Password do not match');
            error.code = 400;
            throw error;
        }

        //generate access and refresh tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_SECRET_KEY, { expiresIn: '1d' });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET_KEY, { expiresIn: '7d' });


        //send access token in json response and set refresh token in cookie
        res
            .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
            .send({
                success: true,
                message: 'Login successful',
                accessToken: accessToken

            });


    }

    catch (error) {
        next(error);
    }

};


const refreshToken = async (req, res, next) => {
    try {

        //get refresh token from cookies
        const refreshToken = req.cookies['refreshToken'];

        //if no refresh token found , send please login
        if (!refreshToken) {
            const error = new Error('Access Denied. No refresh token provided. Please login.');
            error.code = 401;
            throw error;
        }

        //verify refresh token and generate new access token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);
        const accessToken = jwt.sign({ id: decoded.id, }, process.env.ACCESS_SECRET_KEY, { expiresIn: '1d' });


        //set access token in auth header
        res
            .header('Authorization', `Bearer ${accessToken}`)
            .send({
                success: true,
                accessToken: accessToken
            });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login, signup, refreshToken
};