const MongoClient = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017';
const fs = require('fs');

const dbName = "population";
const mapPathsCollection = "map-paths";
const stateCollection = "states";
const countyCollection = "counties";

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
  let keyIndex;
  lines.forEach((line, index) => {
    let data = line.split("|");
    if (data.length > 1) {
      if (index === 0) {
        headers = data;
        keyIndex = headers.findIndex(x => x === "Geographic Area");
      }
      else {
        let geographicArea = data[keyIndex];
        geographicArea = geographicArea.replace(/ county,/ig, ',');
        geographicArea = geographicArea.replace(/ census area,/ig, ',');
        geographicArea = geographicArea.replace(/ municipality,/ig, ',');
        geographicArea = geographicArea.replace(/ borough,/ig, ',');
        geographicArea = geographicArea.replace(/ parish,/ig, ',');
        geographicArea = geographicArea.replace(/ city,/ig, 'City,');
        let combined = geographicArea.split(",");
        let county = combined[0];
        let state = combined[1];

        if (!(state in results)) {
          results[state] = {};
        }
        results[state][county] = {};

        for (let i = 0; i < headers.length; i++) {
          let val = data[i];
          let key = headers[i];
          if (key !== "Geographic Area" && key !== "Census" && key !== "Estimates Base") {
            val = stringToNumber(val);
            results[state][county][key] = val;
          }
        }
      }
    }
  });

  let data = [];
  for (let state in results) {
    for (let county in results[state]) {
      let obj = {
        state, county, years: []
      };

      for (let year in results[state][county]) {
        obj.years.push({
          year,
          population: results[state][county][year]
        });
        obj.years.sort((a, b) => (a.year > b.year) ? 1 : -1);
      }
      data.push(obj);
    }
  }
  return data;
}

MongoClient.connect(url, (e, db) => {
  if (e) throw e;
  let dbo = db.db(dbName);
  console.log(`Created ${dbName}`);

  // add map paths to database
  let rawMapPathData = fs.readFileSync('./data/counties-10m.json');
  let mapPathData = JSON.parse(rawMapPathData);
  dbo.collection(mapPathsCollection).insertOne(mapPathData, (e, res) => {
    if (e) throw e;
    console.log(`successfully added ${mapPathsCollection}`);
  });

  // add state data to database
  const stateOldFile = fs.readFileSync("./data/popest-annual-historical.csv", "utf-8");
  const stateOldData = convertStateToJson(stateOldFile);

  const stateNewFile = fs.readFileSync("./data/popest-annual.csv", "utf-8");
  const stateNewData = convertStateToJson(stateNewFile);

  let stateData = combineOldAndNew(stateOldData, stateNewData);

  dbo.collection(stateCollection).insertMany(stateData, (e, res) => {
    if (e) throw e;
    console.log(`successfully added ${res.insertedCount} documents to ${stateCollection}`);
  });


  // add counties to database
  let rawCountyData = fs.readFileSync('./data/co-est2019-annres.csv', "utf-8");
  let countyData = cleanCountyFile(rawCountyData);
  dbo.collection(countyCollection).insertMany(countyData, (e, res) => {
    if (e) throw e;
    console.log(`successfully added ${res.insertedCount} documents to ${countyCollection}`);
    db.close();
  });
});