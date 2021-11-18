const express = require("express");
const { getMapPaths, getStateData } = require("./db");

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
