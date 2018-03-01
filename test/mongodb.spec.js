// TODO: Remove it later
const { expect } = require('chai');

const { MongoClient } = require('mongodb');

describe('MongoDB', () => {
  let client;

  it('should ', async () => {
    const dbName = 'test';
    const expectedData = { test: 1 };

    // Use connect method to connect to the Server
    client = await MongoClient.connect(`mongodb://localhost:27017/${dbName}`);
    const collection = client.db(dbName).collection('testCollection');

    await collection.insertOne(expectedData);
    const [actualData] = await collection.find({}).toArray();

    expect(actualData).to.be.deep.equal(expectedData);

    await client.close();
  });
});
