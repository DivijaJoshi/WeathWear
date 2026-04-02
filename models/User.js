const mongoose = require('mongoose');
const validator = require('validator');

const user = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name required'],
        trim: true,
        match: [/^[A-Za-z\s]+$/, 'Name should only contain alphabets and space.']
    },
    email: {
        type: String,
        required: [true, 'Email required'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Invalid email']

    },
    password: {
        type: String,
        required: [true, 'Password required']
    },
    gender:
    {
        type: String,
        enum: { values: ['male', 'female'], message: 'Invalid gender' },
        default: null
    },
    skinTone: {
        type: String,
        default: null
    },
    colorPalette: {
        type: String,
        enum: { values: ['spring', 'summer', 'autumn', 'winter'], message: 'Invalid color palette' },
        default: null
    },
    userImage: {
        type: String,
        default: null
    },
    ImageMimeType: {
        type: String,
        default: null
    }


}, { timestamps: true });

const User = mongoose.model('User', user);
module.exports = User;