
const addClothesSchema = {
    allowedFields: ['clothingName', 'clothingType', 'clothingMaterial', 'comfort'],
    requiredFields: ['clothingName', 'clothingType', 'clothingMaterial', 'comfort']
};

const generateOutfitSchema = {
    allowedFields: ['occasion', 'style', 'city', 'comfortScore', 'timeOfDay', 'mode'],
    requiredFields: ['occasion', 'style', 'city', 'comfortScore', 'timeOfDay']
};

const setFavouriteSchema={
    allowedFields: ['isFavourite'],
    requiredFields: ['isFavourite']
};


module.exports = { addClothesSchema, generateOutfitSchema,setFavouriteSchema };
