const mongoose = require('mongoose');
const { clothingMaterials, clothingTypes } = require('../ClothingDetails/clothingDetails');



const closet = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'userId is required']
    },

    clothingName: {  //user can label it so they remember like red tshirt with black polka etc.
        type: String,
        required: [true, 'clothingName is required'],
    },
    clothingType: {
        type: String,
        enum: {
            values: clothingTypes,
            message: `Invalid clothing Type can only be from: ${clothingTypes}`
        },
        required: [true, 'clothingType is required']
    },
    clothingMaterial: {
        type: String,
        enum: {
            values: clothingMaterials,
            message: `Invalid clothing Type can only be from: ${clothingMaterials}`
        },
        required: [true, 'clothingMaterial is required']
    },
    comfort: {
        type: Number,
        required: [true, 'comfort is required'],
        min: [1, 'comfort value should be between 1-5'],
        max: [5, 'comfort value should be between 1-5']
    },
    description: {
        type: String,
        default: null
    },
    imageURI: {
        type: String,
        default: null
    },
    cloudinaryPublicId: {
        type: String,
        default: null
    }


}, { timestamps: true });


closet.index({ userId: 1, clothingName: 1 }, {
    unique: true
});
closet.index({ userId: 1, comfort: 1 });


const Closet = mongoose.model('Closet', closet);

module.exports = Closet; 