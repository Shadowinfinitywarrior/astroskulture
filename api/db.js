const { MongoClient } = require('mongodb');
const uri = 'mongodb+srv://teamastros404_db_user:astroskulture@astroskulture.ymsrdsr.mongodb.net/?retryWrites=true&w=majority&appName=astroskulture';
let client;

async function connectDB() {
  if (client && client.topology && client.topology.isConnected()) {
    return client.db('astros');
  }
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 30000, // 30 seconds timeout
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
    maxPoolSize: 10,
    retryWrites: true,
    w: 'majority'
  });
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client.db('astros');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

module.exports = connectDB;