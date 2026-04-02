const amqp = require('amqplib');
const { QUEUES, EXCHANGE, ROUTING_KEYS } = require('../constants/queueNames');

let channel;
const RabbitMQ = async (url) => {

    const connection = await amqp.connect(url);
    channel = await connection.createChannel();

    // Assert exchange
    await channel.assertExchange(EXCHANGE, 'direct', {
        durable: true
    });

    // Declare queues - durable ensures they survive restarts
    await channel.assertQueue(QUEUES.SKIN_QUEUE, {
        durable: true
    });

    await channel.assertQueue(QUEUES.OUTFIT_QUEUE, {
        durable: true
    });

    await channel.assertQueue(QUEUES.CLOTHING_QUEUE, {
        durable: true
    });

    // Bind queues to exchange with routing keys
    await channel.bindQueue(QUEUES.SKIN_QUEUE, EXCHANGE, ROUTING_KEYS.SKIN_KEY);
    await channel.bindQueue(QUEUES.OUTFIT_QUEUE, EXCHANGE, ROUTING_KEYS.OUTFIT_KEY);
    await channel.bindQueue(QUEUES.CLOTHING_QUEUE, EXCHANGE, ROUTING_KEYS.CLOTHING_KEY);


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

