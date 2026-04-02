
const { getChannel } = require('../config/rabbitMQ');
const { EXCHANGE, ROUTING_KEYS, QUEUES } = require('../constants/queueNames');

const AnalyserProducer = async (content, isSkinAnalyser, isClothingAnalyser, userId, clothingId) => {
    const channel = getChannel();



    let message;

    if (isSkinAnalyser) {
        message = {
            content: content,
            isSkinAnalyser: isSkinAnalyser,
            userId: userId

        };
        channel.publish(EXCHANGE, ROUTING_KEYS.SKIN_KEY, Buffer.from(JSON.stringify(message)));
        console.log(`${JSON.stringify(message)} published to ${QUEUES.SKIN_QUEUE}`);

    }
    else if (isClothingAnalyser) {
        message = {
            content: content,
            isClothingAnalyser: isClothingAnalyser,
            userId: userId,
            clothingId: clothingId

        };
        channel.publish(EXCHANGE, ROUTING_KEYS.CLOTHING_KEY, Buffer.from(JSON.stringify(message)));
        console.log(`${JSON.stringify(message)} published to ${QUEUES.CLOTHING_QUEUE}`);

    }



};


module.exports = AnalyserProducer;