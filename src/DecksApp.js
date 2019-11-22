import React from "react";
import "./App.css";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/ListGroup";
import "bootstrap/dist/css/bootstrap.min.css"; //import the bootstrap stylings

class MatchDisplay extends React.Component {
  render() {
    const { isLoaded, error, matches } = this.props;
    // var matches = [{
    //   deckCode: "CEAAECABAIDASDAUDIOC2OIJAECBEEY3DQTSQNBXHMBAEAIEBUWAIAICC4MB4KY",
    //   deckList: {"01IO006": 2, "01IO009": 2, "01IO012": 2, "01IO020": 2, "01IO026": 2},
    //   opponentName: "decks_mediumdraven_name",
    //   summonerName: "Mezmor",
    //   summonerVictory: false,
    //   timeStamp: "2019-11-18T00:20:16.603Z",
    //   _id: "5dd1e3c0585f9c3e28def61a"
    // }];
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else if (matches === undefined || matches.length == 0) {
      console.log("no matches");
      return <div>No results!</div>;
    } else {
      return (
        <Tab.Container
          id="matchlistnav"
          defaultActiveKey={"#" + matches[0]._id}
        >
          <Row>
            <Col sm={4}>
              <ListGroup>
                {matches.map(match => (
                  <ListGroup.Item
                    variant={match.summonerVictory ? "success" : "danger"}
                    action
                    href={"#" + match._id}
                  >
                    <p>{match.summonerName}</p>
                    <strong>{getVictoryText(match)}</strong>
                    <p>{match.timeStamp}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>
            <Col sm={8}>
              <Tab.Content>
                {matches.map(match => (
                  <Tab.Pane eventKey={"#" + match._id}>
                    <p>Time: {match.timeStamp}</p>
                    <p>Summoner: {match.summonerName}</p>
                    <p>Opponent: {match.opponentName}</p>
                    <p>
                      Winner:{" "}
                      {match.summonerVictory
                        ? match.summonerName
                        : match.opponentName}
                    </p>
                    <p>Summoner Deck Code: {match.deckCode}</p>
                    <p>Summoner Deck List: {JSON.stringify(match.deckList)}</p>
                  </Tab.Pane>
                ))}
              </Tab.Content>
            </Col>
          </Row>
        </Tab.Container>
      );
    }
  }
}

function getVictoryText(match) {
  if (match.summonerVictory) {
    return "Game WON";
  } else {
    return "Game LOST";
  }
}

//the main location where all of the components of our application will come together.
//since we are using react-bootstrap and should be doing very little in the way of
//custom components most of it will be directly here and not in other files.
class DecksApp extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      summonerName: "",
      matches: []
    };
  }

  render() {
    return (
      <div>
        <MatchDisplay
          isLoaded={this.state.isLoaded}
          error={this.state.error}
          matches={this.state.matches}
        />
      </div>
    );
  }
}

export default DecksApp;
