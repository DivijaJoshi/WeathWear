const mongoose = require('mongoose');

const connectDb = async (url) => {

    await mongoose.connect(url);
    console.log('connected to Mongodb');

};


module.exports = connectDb;