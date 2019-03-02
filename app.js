//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");

const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

//create connection to mongoose
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

//create schema

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

// create encrypt -mongoose

const secret = "Thisisourlittlesecret."; // type whatever SINGLE text
userSchema.plugin(encrypt, {secret: secret, encryptedFields: ["password"] }); //use encrypt PLUGIN  they allow for applying pre-packaged capabilities to extend their functionality.
//also we are Encrypted Only password Field



//create a model

const User = mongoose.model("User", userSchema);



app.get("/",function(req,res){
  res.render("home");
});

app.get("/login",function(req,res){
  res.render("login");
});

app.get("/register",function(req,res){
  res.render("register");
});


//create post request

app.post("/register", function(req,res){
  const newUser = new User({
    email: req.body.username,
    password:req.body.password
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }else{
        res.render("secrets");
    }
  });

});

app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password; // whatever the user types

User.findOne({email: username}, function(err, foundUser){
  if(err){
    console.log(err);
  }else{
     if(foundUser){ //do we have a user in our database?
      if(foundUser.password === password) { // does the password the user types matches the one we have on our database?
        res.render("secrets");
      }
    }
  }

});
});





// app.get("/secrets",function(req,res){
//   res.render("secrets");
// });



app.listen(3000, function(){
  console.log("Server Started on port 3000");
});
