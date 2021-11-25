const express = require('express');
const data = require('./app-data');
const app = express();
const fs = require('fs');
const { init } = require("./db");

const port = 3000;

app.use('/data', data);

app.engine('html', require('ejs').renderFile);
//app.set('views', __dirname + '/public/');

// static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));

app.get('/', (req, res) => {
  res.render('country-view.html');
  //fs.readFile('./public/country-view.html', (err, data) => {
  //  if (err) throw err;
  //  res.writeHead(200, { 'Content-Type': 'text/html' });
  //  res.end(data);
  //});
})

app.get('/state/:id', (req, res) => {
  let state = req.params.id;
  res.render('state-view.html', { state });
})

app.listen(port, () => {
  init();
  console.log(`App listening on port ${port}`);
})