const { MongoClient } = require('mongodb');
async function test() {
  const client = new MongoClient('mongodb+srv://teamastros404_db_user:astroskulture@astroskulture.ymsrdsr.mongodb.net/?retryWrites=true&w=majority&appName=astroskulture');
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    await client.db('astros').command({ ping: 1 });
    console.log('Ping successful');
    await client.close();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}
test();