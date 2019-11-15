//This will be the way we interface with our DB.
//Essentially a little api for requesting info
const express = require("express");
const router = express.Router();

//Data Model
//this is temporary and will need to be replaced once we know
//what data we want our object responses from the DB to return
const Data = require("../../models/dataModel");

////////////////////// Database API //////////////////////////////////////////
//UPDATE AS NEEDED

//GET api/data
//Generic get with no filter
//Public
router.get("/", (req, res) => {
  Data.find() //returns a promise
    .then(data => res.json(data)); //returns the requested data from Mongoose as a JSON
});

//POST api/data
//Generic post with no specific data to write
//Public (if we get authenication we will need to authenicate)
router.post("/", (req, res) => {
  const newItem = new Data({});
  newItem.save().then(item => res.json(item));
});

//Can add new various endpoints(beyond simply /) and request type as necessary(PUT, PACTH, DELETE) etc.

module.exports = router;
