
const { getChannel } = require('../config/rabbitMQ');

const AnalyserProducer = async (content, isSkinAnalyser, isClothingAnalyser, userId, clothingId) => {
    const channel = getChannel();



    let message;

    if (isSkinAnalyser) {
        message = {
            content: content,
            isSkinAnalyser: isSkinAnalyser,
            userId: userId

        };
        channel.publish('WeathWear_Exchange', 'analyse_skinTone', Buffer.from(JSON.stringify(message)));
        console.log(`${JSON.stringify(message)} published to analyseSkin_queue}`);

    }
    else if (isClothingAnalyser) {
        message = {
            content: content,
            isClothingAnalyser: isClothingAnalyser,
            userId: userId,
            clothingId: clothingId

        };
        channel.publish('WeathWear_Exchange', 'analyse_clothing', Buffer.from(JSON.stringify(message)));
        console.log(`${JSON.stringify(message)} published to analyseClothing_queue}`);

    }



};


module.exports = AnalyserProducer;