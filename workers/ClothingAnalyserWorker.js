const { getChannel } = require('../config/rabbitMQ');
const { geminiCall } = require('../config/gemini');
const Closet = require('../models/Closet');
const ClothingAnalyserWorker = async () => {

    const channel = getChannel();


    // Prefetch 1 message at a time for fair distribution
    // (no. of messages sent to a consumer before message ack of past message)
    channel.prefetch(1, false); //Applies to individual consumers

    await channel.consume('analyseClothing_queue', async (msg) => {
        try{
            if (msg) {
                const message = JSON.parse(msg.content.toString());
                const { content, isClothingAnalyser, userId, clothingId } = message;


                // geminiCall parameters: (content,isSkinAnalyser,isClothingAnalyser)
                const data = await geminiCall(content, false, isClothingAnalyser);  //returns JSON obj

                const updateClothing = await Closet.findByIdAndUpdate(clothingId, {
                    description: data.description
                }, { new: true });

                console.log('Updated Clothing: ', updateClothing);

                // Acknowledge after successful processing
                channel.ack(msg);
            }

        }catch(error){
            console.error('Worker error:', error); 
            // false = do not requeue (prevents infinite loop) 
            channel.nack(msg, false, false); 

        }
    });




};

module.exports = ClothingAnalyserWorker;