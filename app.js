const express = require('express');
const data = require('./app-data');
const app = express();
const { init } = require("./db");

const port = 3000;

app.use('/data', data);

// static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));

app.listen(port, () => {
  init();
  console.log(`App listening on port ${port}`);
})