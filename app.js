const path = require('path');
const express = require('express');

const app = express();

app.use(express.urlencoded({extended: false}));

app.get('/', function(req, res){
  const htmlFilePath = path.join(__dirname, 'views', 'index.html');
  res.sendFile(htmlFilePath);
});

app.get('/about', function(req, res){
  const htmlFilePath = path.join(__dirname, 'views', 'about.html');
  res.sendFile(htmlFilePath);
});

app.get('/submission-form', function(req, res){
  const htmlFilePath = path.join(__dirname, 'views', 'submission-form.html');
  res.sendFile(htmlFilePath);
});

app.listen(3000);