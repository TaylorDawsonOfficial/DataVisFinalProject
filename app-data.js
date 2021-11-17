const express = require("express");
const fs = require("fs");
const { getMapPaths, getStateData } = require("./db");
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "datavis";
const client = new MongoClient(url);
let db, col;

const router = express.Router();

router.get("/topology", (req, res) => {
  getMapPaths().then((data) => {
    res.send(data);
  });
});

router.get("/population", (req, res) => {
  getStateData().then((data) => {
    res.send(data);
  });
});

module.exports = router;
