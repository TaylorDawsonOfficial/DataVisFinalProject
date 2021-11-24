const express = require('express');
const data = require('./app-data');
const app = express();
const fs = require('fs');
const { init } = require("./db");

const port = 3000;

app.use('/data', data);

// static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));

app.get('/', (req, res) => {
  fs.readFile('./public/country-view.html', (err, data) => {
    if (err) throw err;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
})

app.listen(port, () => {
  init();
  console.log(`App listening on port ${port}`);
})