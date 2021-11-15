const express = require('express');
const fs = require('fs');
const { getMapPaths } = require("./db");

const router = express.Router();

router.get('/topology', (req, res) => {
  getMapPaths().then(data => {
    res.send(data);
  });
});

module.exports = router;