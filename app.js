var express = require('express');
var app = express();
app.get('/', function (req, res) {
  res.send('Welcome to Bachelor Party App!');
});
app.listen(3000, function () {
  console.log('Bachelor Party App listening on port 3000!');
});