const ClothingAnalyserWorker = require('./ClothingAnalyserWorker');
const SkinAnalyserWorker = require('./SkinAnalyserWorker');
const GenerateOutfitWorker = require('./GenerateOutfitWorker');

//store available workers object with queuename
const AvailableWorkers = {
    'analyseSkin_queue': SkinAnalyserWorker,
    'generate_outfit_queue': GenerateOutfitWorker,
    'analyseClothing_queue': ClothingAnalyserWorker
};


const WorkerManager = async (channel) => {

    //store queue name and worker count
    const defaultWorkers = {
        'analyseSkin_queue': 1,
        'generate_outfit_queue': 1,
        'analyseClothing_queue': 1
    };


    const minWorkers = 1; //set min workers running to initialise for each queue
    const maxWorkers = 4;  //set max workers that are allowed 

    const interval = 10000; //10 seconds


    //start initial workers 
    ClothingAnalyserWorker();
    SkinAnalyserWorker();
    GenerateOutfitWorker();

    console.log('initial Worker started for analyseClothing_queue');
    console.log('initial Worker started for analyseSkin_queue');
    console.log('initial Worker started for generate_outfit_queue');


    //run every 10 seconds to check for new tasks to start new worker or scale
    setInterval(async () => {

        //for each queue find count of messages in queue to scale workers
        for (const queueName in defaultWorkers) {

            const queueInfo = await channel.checkQueue(queueName);
            const messageCount = queueInfo.messageCount;

            //assume 1 worker can handle 2 tasks without very long wait times
            if ((messageCount > defaultWorkers[queueName] * 2) && (defaultWorkers[queueName] < maxWorkers))
            //keep worker count under a threshold value

            {
                //scale and add more workers
                AvailableWorkers[queueName]();
                defaultWorkers[queueName]++; //increment count of worker by 1
                console.log(`More workers added for ${queueName} with message count ${messageCount}`);

            }

            
        }
    }
    , interval);


};

module.exports = WorkerManager;