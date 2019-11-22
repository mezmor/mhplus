const MongoClient = require('mongodb').MongoClient;
const fs = require('fs');
const cardsJSON = JSON.parse(fs.readFileSync('./config/set1-en_us.json'));
const MATCHES_COLLECTION_NAME = "match_summaries";
const PER_DECK_WINS_COLLECTION = "per_deck_wins";
const PER_CARD_WINS_COLLECTION = "per_card_wins";
const PER_CARDCOUNT_WINS_COLLECTION = "per_cardcount_wins";

const cardsMap = new Map();

for (card in cardsJSON){
  cardsMap.set(cardsJSON[card].cardCode, cardsJSON[card].name);
}

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

function connectToDB(uri, callback) {
  MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true }, function(err, client) {
    _db = client.db();
    return callback(err);
  });
}

async function getGameEntriesForSummoner(summonerName) {
  try {
    return await _db.collection(MATCHES_COLLECTION_NAME).find({summonerName: summonerName}).sort([['timeStamp', -1]]).toArray();
  } catch (err) {
    console.log("[DB ERR] " + err);
    return [];
  }
}

async function getGameEntries() {
  try {
    return await _db.collection(MATCHES_COLLECTION_NAME).find({}).sort([['timeStamp', -1]]).toArray();
  } catch (err) {
    console.log("[DB ERR] " + err);
    return [];
  }
}

function writeGameEntry(matchEntry) {
  try{
    _db.collection(MATCHES_COLLECTION_NAME).insertOne(matchEntry, {writeConcern: {w: 1, wtimeout: 1000}});
  } catch(err){
    console.log(err);
  }
}

//takes in a match entry and converts the decklist from cardCodes to cardNames
function convertToCardNames(matchEntry){

  var deckListConverted = {};
  var keys = Object.keys(matchEntry.deckList);

  
  //for each card in the deck list
  for (key of keys){
    //store in new object
    var cardName = cardsMap.get(key);
    deckListConverted[cardName] = matchEntry.deckList[key];
  }

  matchEntry.deckList = deckListConverted;
  return matchEntry;
}

module.exports = { fillMatchEntry, connectToDB, getGameEntries, getGameEntriesForSummoner, 
  writeGameEntry, convertToCardNames,
  computePerCardWinPercentages, computeWinPercentagesIncremental, computeDeckWinPercentages
}



/**
 * HERE LIES MAPREDUCE
 */
function computePerCardWinPercentages() {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  _db.collection(MATCHES_COLLECTION_NAME).mapReduce(
    perCardMap,
    reducerFunc,
    {
      out: PER_CARD_WINS_COLLECTION,
      finalize: finalizeFunc
    }
  );
}

function computePerCardCountWinPercentages() {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  _db.collection(MATCHES_COLLECTION_NAME).mapReduce(
    perCardMap,
    reducerFunc,
    {
      out: PER_CARDCOUNT_WINS_COLLECTION,
      finalize: finalizeFunc
    }
  );
}

function computeDeckWinPercentages() {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  _db.collection(MATCHES_COLLECTION_NAME).mapReduce(
    perDeckMap,
    reducerFunc,
    {
      out: PER_DECK_WINS_COLLECTION,
      finalize: finalizeFunc
    }
  );
}

function computeDeckWinPercentagesForSummoner(summonerName) {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  _db.collection(MATCHES_COLLECTION_NAME).mapReduce(
    perDeckMap,
    reducerFunc,
    {
      query: {summonerName: { $eq: summonerName }},
      out: PER_DECK_WINS_COLLECTION,
      finalize: finalizeFunc
    }
  );
}


function computeWinPercentagesIncremental() {
  _lastWinPrcntComputeDate = new Date(); // This might not be the right place for this.
  _db.collection(MATCHES_COLLECTION_NAME).mapReduce(
    function() { emit(key, value); },
    function(key, values) { return value; },
    {
      query: { timeStamp: { $gt: _lastWinPrcntComputeDate } },
      out: { reduce: PER_DECK_WINS_COLLECTION }, 
      finalize: function(key, reducedValue) { return reducedValue; }
    }
  );
}

function perCardMap() {
  for(cardCode of Object.keys(this.deckList)) {
    var key = cardCode;

    value = {
      winCount: this.summonerVictory ? 1 : 0,
      lossCount: this.summonerVictory ? 0 : 1,
      winPercent: 0
    };
    emit(key, value);
  }
}

function perCardCountMap() {
  for(cardCode of Object.keys(this.deckList)) {
    var key = {
      cardCode: cardCode,
      cardCount: this.deckList[cardCode]
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
    reducedObj.lossCount += value.lossCount;
  });
  return reducedObj; 
}

function finalizeFunc(key, reducedValue) {
  if(reducedValue.winCount > 0) {
    reducedValue.winPercent = 
      reducedValue.winCount / (reducedValue.winCount + reducedValue.lossCount);
  }
  return reducedValue;
}
