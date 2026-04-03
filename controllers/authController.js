const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const AppError=require('../utils/AppError');



const signup = async (req, res, next) => {
    try {


        const { name, email, password, gender } = req.body;

        

        //validate gender
        const allowedGenders = ['male', 'female'];
        if (!allowedGenders.includes(gender)) {
            throw new AppError('Gender must be male or female', 400);
        }

        //check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('Email already exists', 400);
        }


        if (password.length < 8) {
            throw new AppError('Password must be at least 8 characters long', 400);
        }
        //hash password 
        const hashedPassword = await bcrypt.hash(password, 10);

        //create new user
        const newUser=await User.create({ name, email, password: hashedPassword, gender });

        res.status(201).json({ 
            success: true,
            message: 'Sign up successful',
        });



    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {

    try {


        const { email, password } = req.body;

        //Check if user exists by email or credentials are invalid
        const user = await User.findOne({ email });
        if (!user) {
            throw new AppError('Invalid Credentials', 401);
        }

        //verify if password matches the stored password in db
        const passwordMatched = await bcrypt.compare(password, user.password);
        if (!passwordMatched) {
            throw new AppError('Invalid Credentials', 401);
        }

        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
        const REFRESH_TOKEN_EXPIRY= process.env.REFRESH_TOKEN_EXPIRY || '7d';

        //generate access and refresh tokens
        const accessToken = jwt.sign({ id: user._id }, process.env.ACCESS_SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
        const refreshToken = jwt.sign({ id: user._id }, process.env.REFRESH_SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });


        //send access token in json response and set refresh token in cookie
        res
            .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' })
            .send({
                success: true,
                message: 'Login successful',
                data:{accessToken}

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
            throw new AppError('Access Denied. No refresh token provided. Please login.', 401);

        }

        //verify refresh token and generate new access token
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

        const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '1d';
        const accessToken = jwt.sign({ id: decoded.id, }, process.env.ACCESS_SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });


        //set access token in auth header
        res
            .header('Authorization', `Bearer ${accessToken}`)
            .send({
                success: true,
                message:'Token refreshed successfully',
                data: {accessToken}
            });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    login, signup, refreshToken
};