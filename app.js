//jshint esversion:6

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;

//pasport requres
const session = require('express-session');
const  passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const FacebookStrategy = require('passport-facebook').Strategy;

const app = express();



app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));


// session app.

app.use(session({
  secret: 'Our little secret',
  resave: false,
  saveUninitialized: false}));


app.use(passport.initialize()); //start using passport for authentication of our package
app.use(passport.session()); // start passport to take session section

//create connection to mongoose
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});
mongoose.set("useCreateIndex", true);
//create schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String, //this will help to not to make a new database and id everytime when the user uses to login or register using google service)
  secret:String
});

// pluging passport
userSchema.plugin(passportLocalMongoose); //passportLocalMongoose - we use to hash and SALT our passwords and save our users into our MongoDB
userSchema.plugin(findOrCreate); // findOrCreate plugin for our google AOUTH
// create encrypt -mongoose

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] }); //use encrypt PLUGIN  they allow for applying pre-packaged capabilities to extend their functionality.
//also we are Encrypted Only password Field

//create a model

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy()); //create local login strategy

// passport local configurations that will work with any kind of authentcation
passport.serializeUser(function(user, done) {
 done(null, user.id);
});

passport.deserializeUser(function(id, done) {
 User.findById(id, function(err, user) {
   done(err, user);
 });
});

//configurations for googke strategy
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));


// facebook configurations strategy
passport.use(new FacebookStrategy({
  clientID: process.env.APP_ID,
  clientSecret: process.env.APP_SECRET,
  callbackURL: "http://localhost:3000/auth/facebook/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  User.findOrCreate({ facebookId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));

//Letting users to submit Secrets
app.get("/submit", function(req,res){
  //* check to make sure that the user is loged
  if(req.isAuthenticated()){
    //use submit button
    res.render("/submit");
  }else{
    res.redirect("/login");
  }
});


///////////////////////////GET REQUETS////////////////////////////
app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {

  res.render("register");
});


//we will check if the user is authenticated and if so we will give access to secrets page
app.get("/secrets",function(req,res){

  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }

  // Now we want to anyone to see our secret page
// not null like this  {$ne: null}
User.find({"secret":{$ne:null}},function(err,foundUser){
  if(err){
    console.log(err);
  }else{
    if(foundUser){
    res.render("secrets",{usersWithSecrets:foundUser});
  }
}
});

});


//Google Authenticate Requests

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrtes.
    res.redirect('/secrets');
  });



// Facebook Authenticate Requests
  app.get('/auth/facebook',
    passport.authenticate('facebook'));

  app.get('/auth/facebook/secrets',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect secrets.
      res.redirect('/secrets');
    });



    ////////////////////////////LOG OUT///////////////
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/////////////////////////POST REQUEST////////////////////////


//create post request using passport

app.post("/register", function(req, res) {

User.register({username:req.body.username }, req.body.password, function(err,user){
  if(err){
console.log(err);
res.redirect("/");
  }else{
   passport.authenticate("local")(req,res,function(){ //will authenticate first using passport and it will always check if they user has been loged in
     res.redirect("/secrets"); //will create and send the cookie
   });
 }
 });

 //create post request for submut action
 app.post("/submit", function(req,res){
   const submittedSecret = req.user.secret;
   //passport will creat Id for each user created account
    console.log(req.user.id);
   User.findById(req.user.id, function(err, foundUser){
     if(err){
       res.render(err);
     }else{
       if(foundUser){
       foundUser.secret=submited.Secret;
       foundUser.save(function(){
         res.redirect("/secrets");
       });
     }
   }
   });
 });


  //using bcrypt

  // bcrypt.hash(req.body.password, 10, function(err, hash) { //using bcrypt security level 4
  //   // Store hash in your password DB.
  //   const newUser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //
  //   newUser.save(function(err) {
  //     if (err) {
  //       console.log(err);
  //     } else {
  //       res.render("secrets");
  //     }
  //   });
  // });

});

app.post("/login", function(req, res) {

  const user =new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err) {
    if (err) {
   console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){ //will authenticate first using passport and it will always check if they user has been loged in
        res.redirect("/secrets");
      });
    }

  });
  // using bcrypt
  // const username = req.body.username;
  // const password = req.body.password; // whatever the user types
  //
  // User.findOne({
  //   email: username
  // }, function(err, foundUser) {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     if (foundUser) { //do we have a user in our database?
  //       // if(foundUser.password === password) { // does the password the user types matches the one we have on our database?
  //       bcrypt.compare(password, foundUser.password, function(err, resaultfromDB) { //using bcrypt security level 4
  //         if (resaultfromDB === true) {
  //           res.render("secrets");
  //         }
  //
  //       });
  //
  //
  //     }
  //   }
  //
  // });
});


// app.get("/secrets",function(req,res){
//   res.render("secrets");
// });



app.listen(3000, function() {
  console.log("Server Started on port 3000");
});
