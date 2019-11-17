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
      collection.insertOne(this.createMatchSummary(data), {writeConcern: {w: 1, wtimeout: 1000}});
    }
    catch(err){
      console.log(err);
    }
  },

  //this is just a template for what creating a match summary could be
  //if we opt to use mongoose we will instead create a new instance of whatever our Schema is
  //IE: var ms = new MatchSummary(VARIABLES GO HERE);
  createMatchSummary: function(lorData) {
    
    var matchSummary = {
      "summonerVictory": lorData.GameResult.LocalPlayerWon,
      "summonerName": lorData.PositionalRectangles.PlayerName,
      "opponentName": lorData.PositionalRectangles.OpponentName,
      "deckCode":lorData.StaticDeckList.DeckCode,
      "deckList": lorData.StaticDeckList.CardsInDeck
    }

    return matchSummary;
  }
};