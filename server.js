require('dotenv').config();
const http = require('http');
const cookieParser = require('cookie-parser');
const { RabbitMQ, getChannel } = require('./config/rabbitMQ');
const express = require('express');
const fs = require('fs');
const app = express();
const errorHandler = require('./middlewares/errorHandler');
const connectDb = require('./config/mongoDB');
const authRouter = require('./routes/authRoutes');
const userRouter = require('./routes/userRoutes');
const { websocketSetup, getio } = require('./config/socket');
const GeneratorProducer = require('./producers/GeneratorProducer');
const { myCache } = require('./controllers/userController');
const  WorkerManager  = require('./workers/WorkerManager');
const authLimiter=require('./middlewares/authLimiter');
const cors = require('cors'); 

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN,
    credentials: true
}));

//create folder if doesn't exist
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

//create server instance to inititalise socket.io
const server = http.createServer(app);


//parse json req body
app.use(express.json());
//parse form data
app.use(express.urlencoded({ extended: true }));

//parse cookies from request header
app.use(cookieParser());

//socket.io attach to server
websocketSetup(server);

const io = getio();

//listen to connection event
io.on('connection', (socket) => {
    console.log('user connected', socket.id);

    //listener for when user joins a room 
    socket.on('joinRoom', async (roomId) => {
        socket.join(roomId);
        console.log('Joined task room-', roomId);

        //call producer only after user joins room
        //get cache data to call producer
        const Data = myCache.get(roomId);

        //if not data present in cache then data expired or task processed
        if (!Data) {
            return socket.emit('outfitGenerated', 'Task expired, generate outfit again');
        }


        // inputs = {                           // Data = {
        //     occasion,                                   user,                           
        //     season,                                     closet,                            
        //     style,                                      WeatherData,
        //     timeOfDay                                   inputs
        //     mode
        //}                                           }                                      

        

        
        console.log('Calling Producer');
        //call Generator Producer after user joins room
        GeneratorProducer(Data.WeatherData, Data.closet, Data.user, Data.inputs, roomId);
        

    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});



app.use('/api/auth',authLimiter, authRouter);//mount auth routes
app.use('/api/user', userRouter); //mount user routes


// invalid routes middleware
app.use((req, res, next) => {
    const error = new Error('Route not found');
    error.code = 404;
    next(error);
});

//mount global error handler middleware
app.use(errorHandler);


//connect to mongodb
connectDb(process.env.MONGO_URL).then(async () => {

    //connect to rabbitmq after db setup
    await RabbitMQ(process.env.RABBITMQ_URL);
    console.log('RabbitMQ connected');

    //get channel
    const channel = getChannel();

    //start workers
    await WorkerManager(channel);

    
    const PORT = process.env.PORT || 3000; 

    //start server
    server.listen(PORT, () => {
        console.log('Server Started at port', process.env.PORT); 
    });
}).catch(error => {
    console.log(error);
});



