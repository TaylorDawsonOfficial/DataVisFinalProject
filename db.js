const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const dbName = 'population';
const client = new MongoClient(url);
let db;

const init = () => {
  client.connect(e => {
    if (e) throw e;
    db = client.db(dbName);
    console.log(`sucessfully connected to ${dbName}`);
  });
}

const getMapPaths = () => {
  const collection = "map-paths";
  const statePathCol = db.collection(collection);
  return statePathCol.find({}, {}).toArray()
}

module.exports = { init, getMapPaths };