// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require("mongodb")
var MongoClient = mongodb.MongoClient;
var url = process.env.DB_URL;
var session = require('express-session');
var passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy;
//var user = {};
var mongoose = require('mongoose');
var path = require('path');

mongoose.connect(url);

var findOrCreate = require('mongoose-findorcreate')
var Schema = mongoose.Schema;
var UserSchema = new Schema({ twitterId: Number});
UserSchema.plugin(findOrCreate);
var User = mongoose.model('User', UserSchema);

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("we're connected!")
});
// Authentication configuration
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'bla bla bla' 
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    callbackURL: "http://cultured-numeric.glitch.me/auth/twitter/callback"
},
  function(token, tokenSecret, profile, cb) {
    User.findOrCreate({ twitterId: profile.id }, function (err, user) {
      console.log('A new uxer from "%s" was inserted', user.twitterId);
      return cb(err, user);
    });
  }));
passport.serializeUser(function(user, done) {
  done(null, user);
});
passport.deserializeUser(function(user, done) {
  done(null, user);
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                                     failureRedirect: '/login'}));

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  //console.log(JSON.stringify(request.users));
  response.sendFile(__dirname + '/public/views/landing.html');
  //response.set
  
  if (request.user){
    response.redirect("/mypolls")
  } else {
  }
  
});


app.get("/logout", function(request, response){
  request.logout();
  response.redirect('/polls');
})

app.get("/mypolls", function(request, response){
  if (request.user){
    MongoClient.connect(url, function(err, db){
    //var ctr = 0;
      if (db){ 
          console.log("connected to " + url); 
          db.collection("polls").find({"user": request.user.twitterId}).toArray().then(element => {
            //console.log(element);
            var polls = JSON.stringify(element);
            var currentUser = request.user.twitterId
            //response.writeHead(200, {'polls' : polls});
            //response.end("yo");
            response.sendFile(path.join(__dirname + '/public/views/mypolls.html'), {headers: {'polls' : polls,  'currentUser': currentUser}});
          })
          //console.log(polls)
        } 
      if (err) { 
        console.log("did not connect to " + url) 
      } 
    })
  } else {
    response.redirect("/")
  }
})

app.get("/newpoll", function (request, response){
  //if (user.length > 0) {
  if (request.user){
    var currentUser = request.user.twitterId
    response.sendFile(path.join(__dirname + '/public/views/newpoll.html'), {headers: {'currentUser': currentUser}});
  } else {
    response.redirect("/")
  }
})

app.post("/newpoll", function(request, response){
    var poll;
    request.on('data', function(data) {
      poll = JSON.parse(data);
      poll["user"] = request.user.twitterId;
    
      console.log("received: " + JSON.stringify(poll))
      MongoClient.connect(url, function(err, db){
        if (db){
            console.log("connected to " + url);
            db.collection("polls").find({'title' : poll["title"]}).toArray().then(element => {
              if (element == "") {
                db.collection("polls").insert(poll);
                response.redirect("/polladded");
              } else {
                response.redirect("/pollnotadded");
              }
            })
        }
        if (err) {
         console.log("did not connect to " + url)
        }
      })
    })
})

app.get("/polladded", function(request, response){
  response.sendFile(path.join(__dirname + '/public/views/polladded.html'));
})
        
        
app.get("/pollnotadded", function(request, response){
  response.sendFile(path.join(__dirname + '/public/views/pollnotadded.html'));
})
        
app.get("/polls", function(request, response){
  
  MongoClient.connect(url, function(err, db){
  //var ctr = 0;
    if (db){ 
        console.log("connected to " + url); 
        db.collection("polls").find({}).toArray().then(element => {
          //console.log(element);
          var polls = element;
          var currentUser = "";
          if (request.user) {
            var currentUser = request.user.twitterId;
          }
          polls = JSON.stringify(polls);
          //response.writeHead(200, {'polls' : polls});
          //response.end("yo");
          console.log(polls)
          response.sendFile(path.join(__dirname + '/public/views/polls.html'), {headers: {'polls' : polls, 'currentUser': currentUser}});
        })
        //console.log(polls)
      } 
    if (err) { 
      console.log("did not connect to " + url) 
    } 
  })  
})
  
app.get("/polls/:qwe", function (request, response) {
  //request.params.qwe);
  
  MongoClient.connect(url, function(err, db){
  //var ctr = 0;
    if (db){ 
        console.log("connected to " + url); 
        db.collection("polls").find({'title' : request.params.qwe}).toArray().then(element => {
          //console.log(element);
          if (element == "") {
            response.send('no such thing as a "' + request.params.qwe + '"')
          } else {
            var currentUser = "";
            if (request.user) {
              var poll = element;
              //poll1["title"] = JSON.parse(element["title"]);
              //poll1["choices"] = JSON.parse(element["choices"]);
              //poll1["user"] = JSON.parse(request.user.twitterId);
              currentUser = request.user.twitterId;
              poll = JSON.stringify(poll);
              console.log(poll);
            } else {
              
              //var poll1 = element;
              //poll1["user"] = "nouser";
              var poll = JSON.stringify(element);
              console.log(poll);
            }
            
            //poll['title'] = element['title'];
            //poll['choices'] = element['choices'];
            //console.log(poll)
            //response.writeHead(200, {'polls' : polls});
            //console.log("found " + poll);
            response.sendFile(path.join(__dirname + '/public/views/generatePoll.html'), {headers: {'poll' : poll, 'currentUser': currentUser}});
          }
        })
        //console.log(polls)
      } 
    if (err) { 
      console.log("did not connect to " + url) 
    } 
  })
  //response.set()
});

app.post("/polls/:qwe", function(request, response){ 
  
  var title = request.params.qwe;
  request.on('data', function(data) {
    console.log("he hath answered: " + choice);
    var choice = 'choices.' + data.toString();
    var update = {};
    update[choice] = 1;
    MongoClient.connect(url, function(err, db){
      if (db){ 
          db.collection("polls").update(
           { title: title },
           { $inc: update }
          )//.toArray(function(element){console.log(JSON.stringify(element))})
        } 
      if (err) { 
        console.log("did not connect to " + url) 
      } 
    })
    //response.redirect("/polls");
  })
})

app.get("/polls/:qwe/delete", function (request, response) {
  //request.params.qwe);
  
  if (request.user){
    var currentUser = request.user.twitterId;
    
    MongoClient.connect(url, function(err, db){
  //var ctr = 0;
    if (db){ 
        console.log("connected to " + url); 
        db.collection("polls").deleteOne({'title' : request.params.qwe});
        response.redirect("/mypolls");
        //console.log(polls)
      } 
    if (err) { 
      console.log("did not connect to " + url) 
    } 
  })
  } else {
    response.redirect("/")
  }
  
  //response.set()
  });

  //response.sendFile(__dirname + '/views/polls.html', function(){

  //});
  //response.send()


// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
