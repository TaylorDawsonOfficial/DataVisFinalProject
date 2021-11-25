const express = require("express");
const { getMapPaths, getStateData, getPopulationByState, getCountiesByState } = require("./db");

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

router.get("/population/:state", (req, res) => {
  getPopulationByState(req.params.state).then((data) => {
    res.send(data[0]);
  })
})

router.get("/counties/:state", (req, res) => {
  getCountiesByState(req.params.state).then((data => {
    res.send(data);
  }))
})

module.exports = router;
