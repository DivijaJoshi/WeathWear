const { getChannel } = require('../config/rabbitMQ');
const GeminiOutfitGen = require('../config/geminiOutfitGen');
const Outfits = require('../models/Outfits');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getio } = require('../config/socket');
const { myCache } = require('../controllers/userController');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const { QUEUES } = require('../constants/queueNames');



const GenerateOutfitWorker = async () => {

    const channel = getChannel();


    // Prefetch 1 message at a time for fair distribution
    // (no. of messages sent to a consumer before message ack of past message)
    channel.prefetch(1, false); //Applies to individual consumers

    //consume from generate outfit queue
    await channel.consume(QUEUES.OUTFIT_QUEUE, async (msg) => {

        try {

            //if messsage exists parse it
            if (msg) {
                const message = JSON.parse(msg.content.toString());

                //extract message details in fields
                const { weatherData, closet, user, inputs, roomId } = message;


                // GeminiOutfitGen parameters: (weatherData,closet,user,inputs)
                const { outfitData, imageData } = await GeminiOutfitGen(weatherData, closet, user, inputs);

                const io = getio();

                //test mode
                if (inputs.mode === 'test') {

                    io.to(roomId).emit('outfitGenerated', {
                        success: true,
                        mode: 'test',
                        imagePrompt: imageData,
                        outfitDetails: outfitData

                    });
                    channel.ack(msg);
                    myCache.del(roomId);

                    return;
                }


                const buffer = Buffer.from(imageData, 'base64'); //convert to buffer

                //create path to save image to disk temporarily
                const imagePath = path.join('uploads', `outfit_${uuidv4()}.png`);

                fs.writeFileSync(imagePath, buffer);  //saves image to imagePath
                console.log('Image saved to disk');

                // upload to cloudinary
                const cloudinaryResult = await cloudinary.uploader.upload(imagePath, {
                    folder: 'WeathWear/generatedOutfits'
                });

                console.log('Cloudinary upload success:', cloudinaryResult.public_id);

                // delete from disk after upload
                fs.unlink(imagePath, () => { });


                //save new Outfit document in db 
                const outfit = await Outfits.create({
                    userId: user._id,
                    clothingIds: outfitData.clothingIds,
                    occasion: outfitData.occasion,
                    style: outfitData.style,
                    weather: outfitData.weather,
                    Reasoning: outfitData.Reasoning,
                    comfortScore: outfitData.comfortScore,
                    generatedImgUrl: cloudinaryResult.secure_url, //cloudinary URL
                    cloudinaryPublicId: cloudinaryResult.public_id //cloudinary public id,


                });




                //emit result to the roomId so user can see url
                io.to(roomId).emit('outfitGenerated', {
                    success: true,
                    generatedImageUrl: cloudinaryResult.secure_url,
                });

                // Acknowledge after successful processing
                channel.ack(msg);

                //delete cache data after message processed successfully
                myCache.del(roomId);

            }

        }
        catch (error) {
            console.error('Worker error:', error);
            // false = do not requeue (prevents infinite loop) 
            channel.nack(msg, false, false);
        }
    });




};

module.exports = GenerateOutfitWorker;