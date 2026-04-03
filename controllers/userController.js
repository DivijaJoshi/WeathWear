const { ai } = require('../config/gemini');
const Closet = require('../models/Closet');
const User = require('../models/User');
const Outfits = require('../models/Outfits');
const AnalyserProducer = require('../producers/AnalyserProducer');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');
const GetWeather = require('../controllers/weatherController');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const AppError = require('../utils/AppError');


const getProfile = async (req, res, next) => {
    try {


        //get user by Id
        const userExists = await User.findOne(
            { _id: req.user.id },
            { password: 0, userImage: 0, __v: 0 }
        );

        //if user not found throw error
        if (!userExists) {
            throw new AppError('User does not exist', 404);
        }

        return res.status(200).json({
            status: 'success',
            profile: userExists
        });

    } catch (error) {
        next(error);
    }
};

const addClothes = async (req, res, next) => {
    try {

        const { clothingName, clothingType, clothingMaterial, comfort } = req.body;

        //check if no file provided
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }

        //check if clothing name already exists in db for a given user
        const clothingExists = await Closet.findOne({ clothingName, userId: req.user.id });
        if (clothingExists) {
            throw new AppError('Clothing by this clothing Name already exists in your closet', 400);

        }

        console.log('Uploading to Gemini');

        //upload files to gemini
        const myfile = await ai.files.upload({
            file: req.file.path,
            config: { mimeType: req.file.mimetype },
        });

        console.log('Gemini upload success:', myfile.uri);

        //create content obj to be sent to gemini
        const content = {
            uri: myfile.uri,
            mimeType: myfile.mimeType
        };


        console.log('Uploading to Cloudinary');

        const response = await cloudinary.uploader.upload(req.file.path, {
            folder: 'WeathWear/closet'
        });
        console.log('Cloudinary upload success:', response.public_id);


        //create new clothing document in closet
        const Clothing = await Closet.create({
            clothingName,
            clothingType,
            clothingMaterial,
            comfort,
            userId: req.user.id,
            imageURI: response.secure_url,
            cloudinaryPublicId: response.public_id


        });

        //call producer and publish message to queue
        await AnalyserProducer(content, false, true, req.user.id, Clothing._id);

        fs.unlink(req.file.path, () => { });  //delete from server after file uploaded


        res.status(201).json({
            success: true,
            message: 'New clothing added to closet, clothing analysis in progress.'
        });


    }
    catch (error) {
        next(error);
    }
};


const analyseSkinTone = async (req, res, next) => {
    try {

        //check if no file provided
        if (!req.file) {
            throw new AppError('No file uploaded', 400);
        }


        //check if user skin analysis already done and saved to db
        const userExists = await User.findById(req.user.id);
        if (userExists.colorPalette && userExists.skinTone) {
            throw new AppError('Skin tone analyses is already done', 400);
        }


        //upload files to gemini
        const myfile = await ai.files.upload({
            file: req.file.path,
            config: { mimeType: req.file.mimetype },
        });


        //create content obj to be sent to gemini
        const content = {
            uri: myfile.uri,
            mimeType: myfile.mimeType
        };


        //convert image file to base 64 to store in db, later used for outfit generation
        const base64ImageFile = fs.readFileSync(req.file.path, {
            encoding: 'base64',
        });

        //call producer and send message to queue
        await AnalyserProducer(content, true, false, req.user.id, null);



        //store encoded image and its mimetype (mimetype later required for gemini call for outfit generation)
        const user = await User.findByIdAndUpdate(req.user.id, {
            userImage: base64ImageFile,
            ImageMimeType: req.file.mimetype
        });


        fs.unlink(req.file.path, () => { });  //delete from server after file uploaded

        res.status(201).json({
            success: true,
            message: 'Skin Tone analysis in progress.'
        });



    }
    catch (error) {
        next(error);
    }
};



const getCloset = async (req, res, next) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;


        let documentCount = await Closet.countDocuments({ userId: req.user.id })

        const closet = await Closet.find({ userId: req.user.id }).skip(skip).limit(limit)

        if (closet.length === 0) {
            throw new AppError('Closet empty, Add more clothes', 404);
        }

        const totalCount = Math.ceil(documentCount / limit);

        res.status(200).json({
            status: 'success',
            Closet: closet,
            Pagination: {
                currentPage: page,
                pageCount: totalCount,
                totalDocuments: documentCount
            }
        });


    }
    catch (error) {
        next(error);
    }
};



const deleteClothes = async (req, res, next) => {
    try {
        const { id } = req.params;

        //validate mongoose format for taskId
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new AppError('Invalid Mongoose ObjectID', 400);
        }

        //only allowed to delete own clothings
        const deleted = await Closet.findOneAndDelete({
            _id: id,
            userId: req.user.id
        });

        //if deleted is null, no clothing found with that id
        if (!deleted) {
            throw new AppError('No clothing found with this ID', 404);
        }

        //delete from cloudinary 
        await cloudinary.uploader.destroy(deleted.cloudinaryPublicId);

        //delete all generated outfits linked with this clothing id
        const linkedOutfits = await Outfits.find({ clothingIds: id });


        //only if linkedOutfits found then delete them from cloudinary
        if (linkedOutfits.length > 0) {
            for (const outfit of linkedOutfits) {
                await cloudinary.uploader.destroy(outfit.cloudinaryPublicId);
            }

        }

        //delete all linked outfits from db
        await Outfits.deleteMany({ clothingIds: id });

        res.status(200).json({
            success: true,
            message: 'Clothing deleted successfully'
        });


    }
    catch (error) {
        next(error);
    }
};



const generateOutfits = async (req, res, next) => {
    try {

        const { occasion, style, city, comfortScore, timeOfDay, mode } = req.body;

        //call weather api axios function
        console.log(city)

        const WeatherData = await GetWeather(city);
        console.log(WeatherData)

        //find user by id
        const user = await User.findOne({ _id: req.user.id });
        if (!user) {
            throw new AppError('No user found with this id', 404);
        }

        if (!user.colorPalette && !user.skinTone) {
            throw new AppError('Skin tone analysis not done yet', 400);
        }

        //find whole closet of user
        const closet = await Closet.find({
            userId: req.user.id,
            comfort: { $gte: comfortScore }
        });

        if (closet.length === 0) {
            throw new AppError('Closet empty, Add more clothes', 404);
        }

        //set inputs for gemini
        const inputs = {
            occasion,
            style,
            timeOfDay,
            mode

        };

        const roomId = uuidv4();

        const Data = {
            user,
            closet,
            WeatherData,
            inputs,

        };

        const cacheData = myCache.set(roomId, Data, 300); //for 5 minutes set cache



        res.status(200).json({
            success: true,
            roomId: roomId,
            message: mode === 'test' ? 'TEST MODE: Outfit prompt generation in progress' : 'Outfit Generation in Progress'
        });



    }
    catch (error) {
        next(error);
    }
};


const getFavourites = async (req, res, next) => {
    try {


        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let documentCount = await Outfits.countDocuments({ userId: req.user.id, isFavourite: true })

        //find if favourites exist
        const favourites = await Outfits.find({ userId: req.user.id, isFavourite: true }).skip(skip).limit(limit)

        //if no favourites found throw error
        if (favourites.length === 0) {
            throw new AppError('No favourites found', 404);
        }
        //count no. of pages
        const totalCount = Math.ceil(documentCount / limit);

        res.status(200).json({
            success: true,
            outfits: favourites,
            Pagination: {
                currentPage: page,
                pageCount: totalCount,
                totalDocuments: documentCount
            }
        });

    }
    catch (error) {
        next(error);
    }
};


const setFavourite = async (req, res, next) => {
    try {
        const id = req.params.id;

        //validate mongoose format for taskId
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new AppError('Invalid Mongoose ObjectID', 400);
        }

        //check if outfit exists by id
        const outfitExists = await Outfits.findOne({ _id: id, userId: req.user.id });

        //throw error if outfit not found
        if (!outfitExists) {
            throw new AppError('No outfit found with this id', 404);
        }

        //if outfit already marked as favourite cannot mark favourite again
        if (outfitExists.isFavourite === true) {
            throw new AppError('Already marked as favourite', 400);
        }
        const outfit = await Outfits.findByIdAndUpdate(id, { isFavourite: true }, { new: true });

        res.status(200).json({
            success: true,
            message: 'Marked as favourite',
            outfit: outfit
        });



    }
    catch (error) {
        next(error);
    }
};




const removeFavourite = async (req, res, next) => {
    try {
        const id = req.params.id;

        //validate mongoose format for taskId
        const isValid = mongoose.Types.ObjectId.isValid(id);
        if (!isValid) {
            throw new AppError('Invalid Mongoose ObjectID', 400);
        }

        //check if outfit exists by id
        const outfitExists = await Outfits.findOne({ _id: id, userId: req.user.id });

        //if outfit not found throw error
        if (!outfitExists) {
            throw new AppError('No outfit found with this id', 404);
        }

        //if outfit not marked as favourite cannot remove from favourite
        if (outfitExists.isFavourite === false) {
            throw new AppError('Cannot remove from favourite, already not marked as favourite.', 400);
        }

        //remove outfit from favourite
        const outfit = await Outfits.findByIdAndUpdate(id, { isFavourite: false }, { new: true });


        res.status(200).json({
            success: true,
            message: 'Removed from favourites',
            outfit: outfit
        });


    }
    catch (error) {
        next(error);
    }
};


const getGeneratedOutfits = async (req, res, next) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let documentCount = await Outfits.countDocuments({ userId: req.user.id })

        //get all generated outfits
        const outfits = await Outfits.find({ userId: req.user.id }).skip(skip).limit(limit)


        //if not generated outfit found throw error
        if (outfits.length === 0) {
            throw new AppError('No outfits generated yet', 404);
        }

        //count no. of pages
        const totalCount = Math.ceil(documentCount / limit);

        res.status(200).json({
            success: true,
            GeneratedOutfits: outfits,
            Pagination: {
                currentPage: page,
                pageCount: totalCount,
                totalDocuments: documentCount
            }
        });
    }
    catch (error) {
        next(error);
    }
};

module.exports = {
    myCache, getProfile, addClothes, analyseSkinTone, getCloset, deleteClothes, generateOutfits, getFavourites, setFavourite, getGeneratedOutfits, removeFavourite
};


