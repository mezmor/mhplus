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
  }
};