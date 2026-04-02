const ClothingAnalyserWorker = require('./ClothingAnalyserWorker');
const SkinAnalyserWorker = require('./SkinAnalyserWorker');
const GenerateOutfitWorker = require('./GenerateOutfitWorker');
const { QUEUES } = require('../constants/queueNames');

//store available workers object with queuename
const AvailableWorkers = {
    [QUEUES.SKIN_QUEUE]: SkinAnalyserWorker,
    [QUEUES.OUTFIT_QUEUE]: GenerateOutfitWorker,
    [QUEUES.CLOTHING_QUEUE]: ClothingAnalyserWorker
};


const WorkerManager = async (channel) => {

    //store queue name and worker count
    const defaultWorkers = {
        [QUEUES.SKIN_QUEUE]: 1,
        [QUEUES.OUTFIT_QUEUE]: 1,
        [QUEUES.CLOTHING_QUEUE]: 1
    };


    const minWorkers = 1; //set min workers running to initialise for each queue
    const maxWorkers = 4;  //set max workers that are allowed 

    const interval = 10000; //10 seconds


    //start initial workers 
    ClothingAnalyserWorker();
    SkinAnalyserWorker();
    GenerateOutfitWorker();

    console.log(`initial Worker started for ${QUEUES.CLOTHING_QUEUE}`);
    console.log(`initial Worker started for ${QUEUES.SKIN_QUEUE}`);
    console.log(`initial Worker started for ${QUEUES.OUTFIT_QUEUE}`);


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