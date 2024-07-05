var express = require('express');
var app = express();
app.get('/', function (req, res) {
  res.send('Welcome to Bachelor Party App!');
});
app.listen(8080, function () {
  console.log('Bachelor Party listening on port 8080!');
});