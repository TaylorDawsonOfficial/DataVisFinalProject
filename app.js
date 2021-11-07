const express = require('express');
const data = require('./app-data');

const app = express();
const port = 3000;

app.use('/data', data);
app.use(express.static('public'));

// app.get('/', (req, res) => {
//   res.send('Hello World');
// });

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
})