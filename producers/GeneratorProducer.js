const { getChannel } = require('../config/rabbitMQ');

const GeneratorProducer=async(weatherData,closet,user,inputs,roomId)=>{
    const channel=getChannel();


    //store passed message details
    const message = {
        weatherData,
        closet,
        user,
        inputs,
        roomId
    };

    //publish message to generate_outfit queue
    channel.publish('WeathWear_Exchange', 'generate_outfit', Buffer.from(JSON.stringify(message)));
    console.log('Outfit generation job published to queue',message.weatherData);



};

module.exports=GeneratorProducer;