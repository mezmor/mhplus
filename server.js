const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request-promise');
const StateMachine = require('javascript-state-machine');

const dbUtil = require('./db/dbUtil');
const atlasURI = require('./config/keys').altasURI;
const scaleGridURI = require('./config/keys').scaleGridURI;

const app = express();
const port = 9001;    //port the node server will be running on

//DB Setup
dbUtil.connectToDB(atlasURI, function(err,client){
  console.log("Connected to DB.");
  if (err) console.log(err);
});

//App Setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

app.get('/api/matches/', async (req, res) => {
  console.log("[GET] / .");
  res.json(await dbUtil.getGameEntries());
});

app.get('/api/matches/:summoner', async (req, res) => {
  console.log("[GET] / " + req.params.summoner);
  res.json(await dbUtil.getGameEntriesForSummoner(req.params.summoner));
});

app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});


/** 
 * Constants
 */
const GameStateEnum = Object.freeze({
  MENUS: "Menus",
  INPROGRESS: "InProgress"
});

/**
 * State Machine for our listener.
 * 
 * When a state change occurs, the transition functions will take care of farming out the 
 * necessary work and data gathering.
 */
const FSM = StateMachine.factory({
  init: "idle",
  data: function(dbUtil) {
    return { dbUtil: dbUtil }
  },
  transitions: [
    { name: "start", from: "idle", to: "ingame" },
    { name: "stop", from: "ingame", to: "idle" }
  ],
  methods: {
    onStart: function(lifeCycle, lorData) {
      var outputPrefix = "TRANSITION [START] GAME :: ";
      console.log(outputPrefix + "DECKCODE: " + JSON.stringify(lorData.StaticDeckList.DeckCode));
      console.log(outputPrefix + "SUMMONER: " + JSON.stringify(lorData.PositionalRectangles.PlayerName));
      console.log(outputPrefix + "OPPONENT: " + JSON.stringify(lorData.PositionalRectangles.OpponentName));
      this.currentLoRData = lorData;
    },
    onStop: function(lifeCycle, lorData) {
      var outputPrefix = "TRANSITION [STOP] GAME :: ";
      console.log(outputPrefix + "DECKCODE: " + JSON.stringify(this.currentLoRData.StaticDeckList.DeckCode));
      console.log(outputPrefix + "SUMMONER: " + JSON.stringify(this.currentLoRData.PositionalRectangles.PlayerName));
      console.log(outputPrefix + "OPPONENT: " + JSON.stringify(this.currentLoRData.PositionalRectangles.OpponentName));
      console.log(outputPrefix + "GAME HAS LOCAL ID: " + JSON.stringify(lorData.GameResult.GameID));
      if(lorData.GameResult.LocalPlayerWon) {
        console.log(outputPrefix + "GAME WAS WON. Nice.");
      } else {
        console.log(outputPrefix + "GAME WAS LOST. Owned.");
      }      

      var lastMatchEntry = dbUtil.fillMatchEntry(
        new Date(), 
        lorData.GameResult.GameID,
        lorData.GameResult.LocalPlayerWon, 
        this.currentLoRData.PositionalRectangles.PlayerName, 
        this.currentLoRData.PositionalRectangles.OpponentName, 
        this.currentLoRData.StaticDeckList.DeckCode, 
        this.currentLoRData.StaticDeckList.CardsInDeck
      );
      
      this.dbUtil.writeGameEntry(lastMatchEntry);
      this.dbUtil.computeWinPercentages();
      this.dbUtil.computeDeckWinPercentages();
      // delete this.currentLoRData; // Get rid of it after we're done.
    }
  }
});

const mhplusFSM = new FSM(dbUtil);

/**
 * summonerName -> queryResults
 * invalidate on completion of a new game
 * invalidate by querying the new result and replacing. 1 DB write/read per played game. 
 *      O(1) retrieval on page refresh.
 * invalidate by removal. 1 DB write per played game. 1 DB read per page refresh.
 */
var dumbCache = {};

/** 
 * Encapsulation of our LoR datasources and helpers for validation.
 * The ordering of `endPoints` matches the ordering of assignments in `LoRData()`
 */
const endPoints = [
  "http://localhost:21337/game-result",
  "http://localhost:21337/positional-rectangles",
  "http://localhost:21337/static-decklist",
  "http://localhost:21337/expeditions-state"
];

class LoRData {
  constructor(resultJsonArray) {
    this.GameResult = resultJsonArray[0];
    this.PositionalRectangles = resultJsonArray[1];
    this.StaticDeckList = resultJsonArray[2];
    this.ExpeditionState = resultJsonArray[3];
  }

  getGameState() {
    return this.PositionalRectangles.GameState;
  }
}

const validateLoRData = (potentialLoRData) => {
  return (
    !!potentialLoRData.GameResult &&
    !!potentialLoRData.PositionalRectangles &&
    !!potentialLoRData.StaticDeckList &&
    !!potentialLoRData.ExpeditionState
  );
};

/**
 * Core Logic!!! Start reading here!!!
 * This gets called every X seconds at the bottom.
 */
const tick = (endPoints, fsm) => async () => {
  const lorData = new LoRData(await getLoRData(endPoints));
  processLoRData(fsm, lorData);
};

/**
 * The first part of the engine that fetches data from the local LoR Client endpoints.
 */
const getLoRData = async (endPoints) => {
  const promises = endPoints.map(e => performGetRequest(e));
  const results = await Promise.all(promises);
  return results;
};

const performGetRequest = async (endpoint) => {
  try {
    let response = await request.get(endpoint);
    return JSON.parse(response);
  } catch (err) {
    return null;
  }
};

/** 
 * The second part of the engine that processes the LoRData and acts on the engine's FSM.
 * Designed to be testable, so you can pass in any the LoRData or FSM you please.
 * 
 * Start the engine if we see an InProgress frame.
 * Stop the engine if we see a Menus frame.
 */
const processLoRData = (fsm, lorData) => {
  if (!validateLoRData(lorData)) { /*console.log("invalid lor data: " + lorData);*/ return; }
  if (fsm.can('start') && lorData.getGameState() === GameStateEnum.INPROGRESS) {
    fsm.start(lorData);
  } else if (fsm.can('stop') && lorData.getGameState() === GameStateEnum.MENUS) {
    fsm.stop(lorData);
  }
};

/** 
 * Kick off the Match History Plus listener.
*/
setInterval(tick(endPoints, mhplusFSM), 2000);