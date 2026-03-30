const{Server}=require('socket.io');
let io;
const websocketSetup=(server)=>{
    io=new Server(server);

};
const getio=()=>{
    return io;
};

module.exports={websocketSetup,getio};