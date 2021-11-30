const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "population";
const client = new MongoClient(url);
let db;

function stateFormatter(state) {
  let x = state
    .toLowerCase()
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ')
  return x;
}

const init = () => {
  client.connect((e) => {
    if (e) throw e;
    db = client.db(dbName);
    console.log(`sucessfully connected to ${dbName}`);
  });
};

const getMapPaths = () => {
  const collection = "map-paths";
  const col = db.collection(collection);
  return col.find({}, {}).toArray();
};

const getStateMapPath = (state) => {
  const collection = "state-map-paths";
  const col = db.collection(collection);
  return col.findOne({ state: stateFormatter(state) }, {});
}

const getStateData = () => {
  const collection = "states";
  const col = db.collection(collection);
  return col.find({}, {}).toArray();
};

const getPopulationByState = (state) => {
  const collection = "states";
  const col = db.collection(collection);
  return col.findOne({ state: stateFormatter(state) }, {});
}

const getCountiesByState = (state) => {
  const collection = "counties";
  const col = db.collection(collection);
  return col.find({ state: stateFormatter(state) }, {}).toArray();
}

const getStateLandArea = () => {
  const collection = "state-land-area"
  const col = db.collection(collection)
  return col.find({}, {}).toArray();
}

const getCountyLandArea = (state) => {
  const collection = "county-land-area";
  const col = db.collection(collection);
  return col.find({ state: stateFormatter(state) }, {}).toArray();
}

module.exports = {
  init,
  getMapPaths,
  getStateData,
  getPopulationByState,
  getCountiesByState,
  getStateMapPath,
  getStateLandArea,
  getCountyLandArea
};
