const amqp = require('amqplib');

let channel;
const RabbitMQ = async (url) => {

    const connection = await amqp.connect(url);
    channel = await connection.createChannel();

    const exchangeName = 'WeathWear_Exchange';

    await channel.assertExchange(exchangeName, 'direct', {
        durable: true
    });


    //set queueName and routingKey for gemini calls for analysing user skin tone
    const geminiSkinQueue = 'analyseSkin_queue';
    const skinRoutingKey = 'analyse_skinTone';


    //set queueName and routingKey for gemini calls for outfit generation 
    const geminiOutfitQueue = 'generate_outfit_queue';
    const outfitRoutingKey = 'generate_outfit';


    //set queueName and routingKey for gemini calls for analysing closet clothes
    const geminiAnalyseQueue = 'analyseClothing_queue';
    const outfitAnalyseKey = 'analyse_clothing';



    // Declare the queue - durable ensures it survives restarts
    await channel.assertQueue(geminiSkinQueue, {
        durable: true
    });

    // Declare the queue - durable ensures it survives restarts
    await channel.assertQueue(geminiOutfitQueue, {
        durable: true
    });

    // Declare the queue - durable ensures it survives restarts
    await channel.assertQueue(geminiAnalyseQueue, {
        durable: true
    });




    // Bind the queue to the exchange with a routing key
    await channel.bindQueue(geminiSkinQueue, exchangeName, skinRoutingKey);
    await channel.bindQueue(geminiOutfitQueue, exchangeName, outfitRoutingKey);
    await channel.bindQueue(geminiAnalyseQueue, exchangeName, outfitAnalyseKey);


};



const getChannel = () => {
    if (!channel) {
        throw new Error('RabbitMQ channel not initialized. Call RabbitMQ() first.');
    }
    return channel;
};

module.exports = {
    getChannel, RabbitMQ
};

