const QUEUES = {
    CLOTHING_QUEUE: 'analyseClothing_queue',
    SKIN_QUEUE: 'analyseSkin_queue',
    OUTFIT_QUEUE: 'generate_outfit_queue'
};

const EXCHANGE = 'WeathWear_Exchange';

const ROUTING_KEYS = {
    CLOTHING_KEY: 'analyse_clothing',
    SKIN_KEY: 'analyse_skinTone',
    OUTFIT_KEY: 'generate_outfit'
};

module.exports = {
    QUEUES,
    EXCHANGE,
    ROUTING_KEYS
};