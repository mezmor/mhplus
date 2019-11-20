import React from "react";
import "./App.css";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Jumbotron from "react-bootstrap/Jumbotron";
import Tab from "react-bootstrap/Tab";
import ListGroup from "react-bootstrap/ListGroup";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import "bootstrap/dist/css/bootstrap.min.css"; //import the bootstrap stylings

class MatchDisplay extends React.Component {
  render() {
    const { isLoaded, error, matches } = this.props;
    console.log(matches);
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
        <Tab.Container id="matchlistnav" defaultActiveKey={"#" + matches[0]._id }>
          <Row>
            <Col sm={4}>
              <ListGroup>
                {matches.map(match => (
                  <ListGroup.Item 
                    variant={match.summonerVictory ? "success" : "danger" }
                    action href={"#" + match._id}>
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
                      <p>Winner: {match.summonerVictory ? match.summonerName : match.opponentName}</p>
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
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      summonerName: "",
      matches: []
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
  }

  componentDidMount() {
    this.fetchMatches();
  }

  handleSearch(event) {
    // SANITIZE THE SUMMONERNAME HERE!!!
    this.fetchMatches()
    event.preventDefault();
  }

  fetchMatches() {
    let endPoint = "http://localhost:9001/api/matches/" + this.state.summonerName;
    fetch(endPoint)
      .then(res => res.json())
      .then(
        result => {
          this.setState({
            isLoaded: true,
            matches: result
          });
        },
        // Note: it's important to handle errors here
        // instead of a catch() block so that we don't swallow
        // exceptions from actual bugs in components.
        error => {
          this.setState({
            isLoaded: true,
            error
          });
        }
      );
  }

  handleChange(event) {
    this.setState({ summonerName: event.target.value });
  }

  render() {
    return (
      <Container className="p-3">
        <Navbar bg="dark" variant="dark">
          <Navbar.Brand href="#">MHPlus: The Winning Submission</Navbar.Brand>
          <Nav className="mr-auto">
          </Nav>
          <Form inline onSubmit={this.handleSearch}>
          <FormControl 
            className="mr-sm-1"
            placeholder="Summoner name"
            aria-label="Summoner name"
            aria-describedby="basic-addon2"
            value={this.state.summonerName}
            onChange={this.handleChange}
          />
          </Form>
          <Button type="submit" variant="light">
            Search
          </Button>
        </Navbar>

        <Jumbotron>
          <h1 className="header">Match History<strong>+</strong></h1>
        </Jumbotron>

        <MatchDisplay
          isLoaded={this.state.isLoaded}
          error={this.state.error}
          matches={this.state.matches}
        />
      </Container>
    );
  }
}

export default App;
