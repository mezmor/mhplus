//this will be the model for how our data is returned from Mongoose
//we can use this and files like this to specify the properties and 
//structure of the responses from our DB
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

//this is 100% not the final name for the schema or the file itself.
//it is also likely this will not be our only schema
//PLACEHOLDER
const DataSchema = new Schema({
    //fill this in once we know what to look for
});

module.exports = Data = mongoose.model('data', DataSchema);