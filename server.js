const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const request = require('request-promise');
const StateMachine = require('javascript-state-machine');

const data = require('./mongoose/data');
const app = express();
const port = 9001;    //port the node server will be running on

//DB Setup
const dbUtil = require('./dbUtil');
dbUtil.connectToServer(function(err,client){
  console.log("Connected to DB.");
  if (err) console.log(err);
});

// const uri = require('./config/keys').mongoURI;
// const MongoClient = require('mongodb').MongoClient;

// mongoose
//   .connect(uri)
//   .then(() => console.log('Connected Successfully to db.'))
//   .catch(err => console.log(err));


//App Setup
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});
app.use('/api/data', data);

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
      console.log("[START] GAME with DB :: " + this.dbUtil.getDb().databaseName);
      console.log("CURR GAME'S DECKLIST :: " + JSON.stringify(lorData.StaticDeckList));
      console.log("GameResult :: " + JSON.stringify(lorData.GameResult));
      this.currentLoRData = lorData;
    },
    onStop: function(lifeCycle, lorData) {
      console.log("[STOP] GAME with DB :: " + this.dbUtil.getDb().databaseName);
      console.log("LAST GAME'S DECKLIST:: " + JSON.stringify(this.currentLoRData.StaticDeckList));
      console.log("OLD GameResult :: " + JSON.stringify(this.currentLoRData.GameResult));
      console.log("NEW GameResult :: " + JSON.stringify(lorData.GameResult));
      
      this.currentLoRData.GameResult = lorData.GameResult;
      dbUtil.writeData(dbUtil.getDb(), "match_summaries", this.currentLoRData);
      delete this.currentLoRData; // Get rid of it after we're done.
      dbUtil.computeWinPercentages(dbUtil.getDb());
    }
  }
});

const mhplusFSM = new FSM(dbUtil);

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
  if (!validateLoRData(lorData)) { console.log("invalid lor data"); return; }
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