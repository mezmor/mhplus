const MongoClient = require('mongodb').MongoClient;
const uri = require('./config/keys').mongoURI;

var _db;

module.exports = {
  connectToServer: function(callback) {
    MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
      _db = client.db();
      return callback(err);
    });
  },

  getDb: function() {
    return _db;
  },

  writeData: function(db, col, data) {
    try{
      var collection = db.collection(col);
      collection.insertOne(data, {writeConcern: {w: 1, wtimeout: 1000}});
    }
    catch(err){
      console.log(err);
    }
  }
};