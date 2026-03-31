const{Server}=require('socket.io');
let io;
const websocketSetup=(server)=>{
    io=new Server(server);

};
const getio=()=>{
    if (!io) { 
        throw new Error('socket.io not initialized. Call websocketSetup() first.'); 
    }
    return io;
};

module.exports={websocketSetup,getio};