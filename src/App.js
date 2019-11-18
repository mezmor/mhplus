import React from "react";
import "./App.css";
import Accordion from "react-bootstrap/Accordion"; //import the Accordion
import Card from "react-bootstrap/Card"; //import the Card
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Jumbotron from "react-bootstrap/Jumbotron";
import Media from "react-bootstrap/Media";
import "bootstrap/dist/css/bootstrap.min.css"; //import the bootstrap stylings

class MatchList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: null,
      isLoaded: false,
      matches: []
    };
  }

  componentDidMount() {
    fetch("http://localhost:9001/api/matches")
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

  render() {
    const { error, isLoaded, matches } = this.state;
    if (error) {
      return <div>Error: {error.message}</div>;
    } else if (!isLoaded) {
      return <div>Loading...</div>;
    } else {
      return (
        <ul className="list-unstyled">
          {matches.map(match => (
            <Media as="li">
              <Media.Body>
                <h6>{getVictoryText(match)}</h6>
                <p>{match.deckCode}</p>
              </Media.Body>
            </Media>
          ))}
        </ul>
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
function App() {
  return (
    <Container className="p-3">
      <Jumbotron>
        <h1 className="header">Welcome to the Winning Submission</h1>
      </Jumbotron>
      <Row>
        <Col xs={3}>
          <MatchList />
        </Col>
        <Col>
          <Accordion>
            <Card>
              <Accordion.Toggle as={Card.Header} eventKey="0">
                Deck Identifier Here
              </Accordion.Toggle>
              <Accordion.Collapse eventKey="0">
                <Card.Body>Deck info here</Card.Body>
              </Accordion.Collapse>
            </Card>
          </Accordion>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
