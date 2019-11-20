const MongoClient = require('mongodb').MongoClient;
const uri = require('../config/keys').mongoURI;

var _db;
var _lastWinPrcntComputeDate;

function fillMatchEntry(timestamp, localGameId, summonerVictory, summonerName, opponentName, deckCode, deckList){
  let result = {
    "timeStamp": timestamp,
    "localGameId": localGameId,
    "summonerVictory": summonerVictory,
    "summonerName": summonerName,
    "opponentName": opponentName,
    "deckCode": deckCode,
    "deckList": deckList
  }
  return result;
}

function connectToDB(callback) {
  MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    _db = client.db();
    return callback(err);
  });
}

async function getGameEntriesForSummoner(summonerName) {
  try {
    console.log(summonerName);
    return await _db.collection("match_summaries").find({summonerName: summonerName}).toArray();
  } catch (err) {
    return null;
  }
}

async function getGameEntries() {
  try {
    return await _db.collection("match_summaries").find({}).toArray();
  } catch (err) {
    return null;
  }
}

function writeGameEntry(matchEntry) {
  try{
    _db.collection("match_summaries").insertOne(matchEntry, {writeConcern: {w: 1, wtimeout: 1000}});
  } catch(err){
    console.log(err);
  }
}

module.exports = { fillMatchEntry, connectToDB, getGameEntries, getGameEntriesForSummoner, writeGameEntry }



/**
 * HERE LIES MAPREDUCE
 */
function computeWinPercentages(db) {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  db.collection('match_summaries').mapReduce(
    perCardMap,
    reducerFunc,
    {
      out: 'per_card_win_percentage',
      finalize: finalizeFunc
    }
  );
}

function computeWinPercentagesIncremental(db) {
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
