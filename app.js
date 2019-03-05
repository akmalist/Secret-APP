//jshint esversion:6

require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption");
// const md5 = require('md5');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();



app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({
  extended: true
}));

//create connection to mongoose
mongoose.connect("mongodb://localhost:27017/userDB", {
  useNewUrlParser: true
});

//create schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// create encrypt -mongoose

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"] }); //use encrypt PLUGIN  they allow for applying pre-packaged capabilities to extend their functionality.
//also we are Encrypted Only password Field



//create a model

const User = mongoose.model("User", userSchema);



app.get("/", function(req, res) {
  res.render("home");
});

app.get("/login", function(req, res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});


//create post request

app.post("/register", function(req, res) {

  bcrypt.hash(req.body.password, 10, function(err, hash) { //using bcrypt security level 4
    // Store hash in your password DB.
    const newUser = new User({
      email: req.body.username,
      password: hash
    });

    newUser.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.render("secrets");
      }
    });
  });


});

app.post("/login", function(req, res) {
  const username = req.body.username;
  const password = req.body.password; // whatever the user types

  User.findOne({
    email: username
  }, function(err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) { //do we have a user in our database?
        // if(foundUser.password === password) { // does the password the user types matches the one we have on our database?
        bcrypt.compare(password, foundUser.password, function(err, resaultfromDB) { //using bcrypt security level 4
          if (resaultfromDB === true) {
            res.render("secrets");
          }

        });


      }
    }

  });
});





// app.get("/secrets",function(req,res){
//   res.render("secrets");
// });



app.listen(3000, function() {
  console.log("Server Started on port 3000");
});
