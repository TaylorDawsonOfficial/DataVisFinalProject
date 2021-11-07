const express = require('express');
const fs = require('fs');

const router = express.Router();

router.get('/topology', (req, res) => {
  // todo move this to database
  let rawData = fs.readFileSync('./data/us-states.json');
  res.send(JSON.parse(rawData));
});

module.exports = router;