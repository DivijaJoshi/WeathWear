const mongoose = require('mongoose');
const { clothingStyle } = require('../ClothingDetails/clothingDetails');
const outfits = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required']
    },
    clothingIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Closet',

    }],
    occasion: {
        type: String,
        required: [true, 'occasion is required']
    },
    style: {
        type: String,
        enum: { values: clothingStyle, message: `Invalid style can only be amongst ${clothingStyle}` },
        required: [true, 'style is required']
    },
    weather: {
        type: String,
        default: null
    },
    comfortScore: {
        type: Number,
        min: 1,
        max: 5,
        default: null
    },
    Reasoning: {
        type: String,
        default: null
    },
    isFavourite: {
        type: Boolean,
        default: false
    },
    generatedImgUrl: {
        type: String,
        required: true
    },
    cloudinaryPublicId: {
        type: String,
        required: [true, 'cloudinary public id is required']
    }

}, { timestamps: true });




outfits.index({ userId: 1 });
outfits.index({ userId: 1, isFavourite: 1 });
outfits.index({ clothingIds: 1 });

const Outfits = mongoose.model('Outfits', outfits);
module.exports = Outfits; 