const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/', function (req, res) {
  res.send('Welcome to Bachelor Party App!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});