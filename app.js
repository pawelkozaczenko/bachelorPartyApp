const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', function (req, res) {
  res.send('Welcome to Bachelor Party App!');
});
app.listen(8080, function () {
  console.log('Bachelor Party listening on port ${port}');
});