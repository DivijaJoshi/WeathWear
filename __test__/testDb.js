const mongoose = require('mongoose')


async function connectToDatabase() {

    await mongoose.connect(process.env.MONGO_TEST_URL || 'mongodb://localhost:27017/weathwear_test');
    console.log("Connected to test database");

}

async function disconnectFromDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
}

async function clearCollections() {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany();
    }
}

module.exports = {
    connectToDatabase,
    disconnectFromDatabase,
    clearCollections
};