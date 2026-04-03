const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const auth = require('../middlewares/auth');
const { getProfile, addClothes, analyseSkinTone, getCloset, deleteClothes, generateOutfits, getFavourites, setFavourite, getGeneratedOutfits } = require('../controllers/userController');
const { addClothesSchema, generateOutfitSchema,setFavouriteSchema } = require('../schemas/userSchemas');
const validate = require('../middlewares/validate');



router.get('/getProfile', auth, getProfile); //get user profile
router.post('/addClothes', auth, upload.single('image'), validate(addClothesSchema), addClothes); //add clothes to closet and upload image to cloudinary
router.post('/analyseSkinTone', auth, upload.single('image'), analyseSkinTone); //analys skin tone and save to user db
router.get('/getCloset', auth, getCloset); //get all clothes from closet
router.delete('/deleteClothes/:id', auth, deleteClothes); //delete clothes by id from db and cloudinary
router.post('/generateOutfits', auth, validate(generateOutfitSchema), generateOutfits); //generate outfits with gemini
router.get('/getFavourites', auth, getFavourites); //get user favourites
router.patch('/outfits/:id/favourite', auth,validate(setFavouriteSchema),setFavourite); // set/remove favourite outfit from generated outfits by id
router.get('/getGeneratedOutfits', auth, getGeneratedOutfits); //get all past generated outfits

//if(clothes deleted from closet, delete linked generated outfits from db and too)

module.exports = router;