var _ = require("lodash") 
var express = require("express") 
var bodyParser = require("body-parser") 
var jwt = require('jsonwebtoken') 
var mqtt = require('mqtt')

var mongoose = require('mongoose');
var mongodb = 'mongodb://192.168.56.101:27017/agrihub';
mongoose.connect(mongodb);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
// var users = [ 
//   { 
//     username: 'andriwarda', 
//     password: 'nosecret', 
//     acc:'' 
//   } 
// ]; 

var Schema = mongoose.Schema;

var userscheme = new Schema({
  _id : String,
  user : String,
  label : String,
  secretkey : String,
  subsperday : Number,
  subsperdayremain : Number,
  sensor : [{
    id : String,
    label : String
  }]
})

var userskema = new Schema({
  _id : String,
  username : String,
  email : String,
  password : String,
  first_name : String,
  last_name : String,
  is_admin : Number 
})

var Nodes = mongoose.model('nodes', userscheme)
var Skema = mongoose.model('user', userskema)

var tokenArray = [] 
var secretKey = "kljposdao9740iyuonckl0q7340" 
var app = express() 

app.use(bodyParser.urlencoded({ 
  extended: true 
})); 

app.use(bodyParser.json()); 

app.post("/auth", function (req, res) { 
  if (req.headers.authorization) { 
    var token = req.headers.authorization.split(' ')[1] 
  } 
  if (token) { 
    jwt.verify(token, secretKey, function(err, decoded) { 
      if (err) { 
        console.log('invalid token!') 
        res.sendStatus(403) 
      } else { 
        req.decoded = decoded 
        console.log('jwt decoded', decoded) 
        res.sendStatus(200) 
      } 
    }); 
  } else { 
    console.log('token not found!') 
    res.sendStatus(403) 
  } 
}) 

app.post("/jwt", function(req, res) {
  if('s3rv3r' == req.body.username) {
      var payload = {
          username: 's3rv3r'
      }
      var token = jwt.sign(payload, secretKey, {expiresIn : '3m'}) 
      console.log('Token generated!', token) 
      res.send(token) 
      res.sendStatus(200) 
  }
  Nodes.findOne({label:req.body.username}, function(err, user)){
    if(err || !user){ 
      console.log('user not found!') 
      res.sendStatus(403) 
    } else { 
      if(user.label == req.body.username && user.secretkey == req.body.password) { 
        var payload = { 
          username: user.label, 
          id: user.user
        } 
        var token = jwt.sign(payload, secretKey, {expiresIn : '3m'}) 
        console.log('Token generated!', token) 
        res.send(token) 
      } else { 
        console.log('username and password missmatch!') 
        res.sendStatus(403) 
      } 
    }
  }  
}) 

app.post("/acl", function (req, res) {
  Nodes.findOne({label: req.body.username}, function(err, node){
    Skema.findOne({_id: node.user}, function(err, user) {
        if (req.body.topic == user.username+'/'+node.label) {
          res.sendStatus(200)
        } else{
          res.sendStatus(403) 
        }
    })
  })
  
}) 

app.post("/superuser", function (req, res) {
  if('s3rv3r' == req.body.username) { 
      res.sendStatus(200) 
  }
  res.sendStatus(403) 
}) 

app.listen(3000, function() { 
  console.log("Express running") 
})
