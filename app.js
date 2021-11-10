const express = require('express');
const data = require('./app-data');
const app = express();
const port = 3000;

app.use('/data', data);

// static files
app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/js', express.static(__dirname + 'public/js'));

//app.get('/', (req, res) => {
//  res.render("index");
//});

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})