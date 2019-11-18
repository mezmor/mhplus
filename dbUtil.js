const MongoClient = require('mongodb').MongoClient;
const uri = require('./config/keys').mongoURI;

var _db;
var _lastWinPrcntComputeDate;

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
      "timeStamp": new Date(),
      "summonerVictory": lorData.GameResult.LocalPlayerWon,
      "summonerName": lorData.PositionalRectangles.PlayerName,
      "opponentName": lorData.PositionalRectangles.OpponentName,
      "deckCode":lorData.StaticDeckList.DeckCode,
      "deckList": lorData.StaticDeckList.CardsInDeck
    }

    return matchSummary;
  },

  computeWinPercentages: function(db) {
    _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
    db.collection('match_summaries').mapReduce(
      perCardMap,
      reducerFunc,
      {
        out: 'per_card_win_percentage',
        finalize: finalizeFunc
      }
    );
  },

  computeWinPercentagesIncremental: function(db) {
    _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
    db.collection('match_summaries').mapReduce(
      function() { emit(key, value); },
      function(key, values) { return value; },
      {
        query: { timeStamp: { $gt: _lastWinPrcntComputeDate } },
        out: { reduce: 'win_percentages' }, 
        finalize: function(key, reducedValue) { return reducedValue; }
      }
    );
  }
};

function perCardMap() {
  for(deckCardCode in this.deckList.keys()) {
    var key = {
      cardCode: deckCardCode,
      cardCount: this.deckList.deckCardCode
    }

    value = {
      winCount: this.summonerVictory ? 1 : 0,
      lossCount: this.summonerVictory ? 0 : 1,
      winPercent: 0
    };
    emit(key, value);
  }
}

function perDeckMap() {
  var key = this.deckCode;
  value = {
    winCount: this.summonerVictory ? 1 : 0,
    lossCount: this.summonerVictory ? 0 : 1,
    winPercent: 0
  };
  emit(key, value);
}

function reducerFunc(key, values) {
  var reducedObj = {
    winCount: 0,
    lossCount: 0,
    winPercent: 0
  }

  values.forEach(function(value){
    reducedObj.winCount += value.winCount;
    reductedObj.lossCOunt += value.lossCount;
  });
  return value; 
}

function finalizeFunc(key, reducedValue) {
  if(reducedValue.winCount > 0) {
    reducedValue.winPercent = 
      reducedValue.winCount / (reducedValue.winCount + reducedValue.lossCount);
  }
  return reducedValue;
}

