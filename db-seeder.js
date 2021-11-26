const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const fs = require('fs');

const dbName = "population";
const mapPathsCollection = "map-paths";
const stateMapPathsCollection = "state-map-paths";
const stateCollection = "states";
const countyCollection = "counties";
const stateLandCollection = "state-land-area";

stringToNumber = (s) => {
  return parseFloat(s.replace(/,/g, ''));
}

convertStateToJson = (csv) => {
  let results = {};
  let lines = csv.split("\r\n");
  let headers;
  let stateIndex;
  lines.forEach((line, index) => {
    let data = line.split("|");
    if (data.length > 1) {
      if (index === 0) {
        headers = data;
        stateIndex = headers.findIndex(x => x === "State");
      }
      else {
        let state = data[stateIndex];
        results[state] = {};
        for (let i = 0; i < headers.length; i++) {
          let val = data[i];
          let key = headers[i];
          if (key !== "State" && key !== "Fips") {
            val = stringToNumber(val);
            results[state][key] = val;
          }
        }
      }
    }
  });
  return results;
}

combineOldAndNew = (oldData, newData) => {
  let results = [];
  for (let key in oldData) {
    let obj = {};
    obj.state = key;
    obj.years = [];
    let populations = { ...oldData[key], ...newData[key] }
    for (let year in populations) {
      obj.years.push({
        year,
        population: populations[year]
      });
      obj.years.sort((a, b) => (a.year > b.year) ? 1 : -1);
    }
    results.push(obj);
  }
  return results;
}

cleanCountyFile = (csv) => {
  let results = {};
  let lines = csv.split("\r\n");
  let headers;
  lines.forEach((line, index) => {
    let data = line.split("|");
    if (data.length > 1) {
      if (index === 0) {
        headers = data;
      }
      else {
        let county = data[0];
        let state = data[1];
        let fips = data[2];

        // county = county.replace(/ county,/ig, ',');
        // county = county.replace(/ census area,/ig, ',');
        // county = county.replace(/ municipality,/ig, ',');
        // county = county.replace(/ borough,/ig, ',');
        // county = county.replace(/ parish,/ig, ',');
        county = county.replace(/ city,/ig, ' City,');

        if (!(state in results)) {
          results[state] = {};
        }
        results[state][county] = {
          "Fips": fips,
          "Years": {}
        };


        for (let i = 0; i < headers.length; i++) {
          let val = data[i];
          let key = headers[i];
          if (key !== "County" && key !== "State" && key !== "Census" && key !== "Estimates Base" && key !== "Fips") {
            val = stringToNumber(val);
            results[state][county]["Years"][key] = val;
          }
        }
      }
    }
  });

  let data = [];
  for (let state in results) {
    for (let county in results[state]) {
      let obj = {
        state,
        county,
        fips: results[state][county].Fips,
        years: []
      };

      for (let year in results[state][county]["Years"]) {
        obj.years.push({
          year,
          population: results[state][county]["Years"][year]
        });
        obj.years.sort((a, b) => (a.year > b.year) ? 1 : -1);
      }
      data.push(obj);
    }
  }
  return data;
}

loadStateMapPaths = () => {
  let path = './data/us-states/';
  let data = [];
  let filenames = fs.readdirSync(path);
  filenames.forEach(filename => {
    let state = filename
      .replace('.json', '')
      .split('-')
      .map(s => s.charAt(0).toUpperCase() + s.substring(1))
      .join(' ')
    let rawMapData = fs.readFileSync(`${path}${filename}`);
    let mapData = JSON.parse(rawMapData);
    data.push({
      state,
      value: mapData
    });
  });

  return data;
}

loadLandArea = (csv) => {
  let results = [];
  let lines = csv.split("\r\n");
  lines.forEach((line, index) => {
    let data = line.split("|");
    if (data.length > 1) {
      let state = data[0];
      let total = stringToNumber(data[1]);
      results.push({
        state,
        "square miles": total
      })
    }
  });
  return results;
}

(async () => {
  let db = await MongoClient.connect(url);
  let dbo = db.db(dbName);
  console.log(`Created ${dbName}`);

  await dbo.collection(mapPathsCollection).drop((e, res) => { });
  await dbo.collection(stateCollection).drop((e, res) => { });
  await dbo.collection(countyCollection).drop((e, res) => { });
  await dbo.collection(stateMapPathsCollection).drop((e, res) => { });
  await dbo.collection(stateLandCollection).drop((e, res) => { });
  console.log("dropped existing collections");

  // add map paths to database
  let rawMapPathData = fs.readFileSync('./data/states-10m.json');
  let mapPathData = JSON.parse(rawMapPathData);
  let res = await dbo.collection(mapPathsCollection).insertOne(mapPathData);
  console.log(`successfully added ${mapPathsCollection}`);

  // add state map paths to database
  let stateMapPathData = loadStateMapPaths();
  res = await dbo.collection(stateMapPathsCollection).insertMany(stateMapPathData);
  console.log(`successfully added ${res.insertedCount} maps to ${stateMapPathsCollection}`);

  // add state land area info to database
  const stateLandArea = fs.readFileSync("./data/state-land-area.csv", "utf-8");
  const stateLandData = loadLandArea(stateLandArea);
  res = await dbo.collection(stateLandCollection).insertMany(stateLandData);
  console.log(`successfully added ${res.insertedCount} documents to ${stateLandCollection}`);

  // add state data to database
  const stateOldFile = fs.readFileSync("./data/popest-annual-historical.csv", "utf-8");
  const stateOldData = convertStateToJson(stateOldFile);
  const stateNewFile = fs.readFileSync("./data/popest-annual.csv", "utf-8");
  const stateNewData = convertStateToJson(stateNewFile);
  let stateData = combineOldAndNew(stateOldData, stateNewData);
  res = await dbo.collection(stateCollection).insertMany(stateData);
  console.log(`successfully added ${res.insertedCount} documents to ${stateCollection}`);

  // add counties to database
  let rawCountyData = fs.readFileSync('./data/co-est2019-annres.csv', "utf-8");
  let countyData = cleanCountyFile(rawCountyData);
  res = await dbo.collection(countyCollection).insertMany(countyData);
  console.log(`successfully added ${res.insertedCount} documents to ${countyCollection}`);

  console.log('all done');
  db.close();
})()