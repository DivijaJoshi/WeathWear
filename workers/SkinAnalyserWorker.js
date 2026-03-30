const { getChannel } = require('../config/rabbitMQ');
const { geminiCall} = require('../config/gemini');
const User = require('../models/User');

const SkinAnalyserWorker = async () => {
    const channel = getChannel();

    // Prefetch 1 message at a time for fair distribution
    // (no. of messages sent to a consumer before message ack of past message)
    channel.prefetch(1, false); //Applies to individual consumers

    await channel.consume('analyseSkin_queue', async (msg) => {
        if (msg) {
            const message = JSON.parse(msg.content.toString());
            const { content, isSkinAnalyser, userId } = message;


            // geminiCall parameters: (content,isSkinAnalyser,isClothingAnalyser)
            const data = await geminiCall(content, isSkinAnalyser, false);  //returns JSON obj


            //if skintone and colorpalette are null, ie invalid image for skin analysis (skip updating db)
            if (!data.skinTone || !data.colorPalette) {
                console.log('Invalid image provided for skin analysis');
                channel.ack(msg);
                return;
            }

            const updateUser = await User.findByIdAndUpdate(userId, {
                skinTone: data.skinTone,
                colorPalette: data.colorPalette
            }, { new: true });

            console.log('Updated User: ', updateUser);

            // Acknowledge after successful processing
            channel.ack(msg);
        }
    });



};

module.exports = SkinAnalyserWorker;