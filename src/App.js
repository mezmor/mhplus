import React from "react";
import "./App.css";
import FormControl from "react-bootstrap/FormControl";
import Button from "react-bootstrap/Button";
import Container from "react-bootstrap/Container";
import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import Form from "react-bootstrap/Form";
import Jumbotron from "react-bootstrap/Jumbotron";
import { BrowserRouter as Router, Switch, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css"; //import the bootstrap stylings
import DecksApp from "./DecksApp";
import GamesApp from "./GamesApp";


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
    this.fetchMatches();
    event.preventDefault();
  }

  fetchMatches() {
    let endPoint =
      "http://localhost:9001/api/matches/" + this.state.summonerName;
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
      <Router>
        <Container className="p-3">
          <Navbar bg="dark" variant="dark">
            <Navbar.Brand>
              <Link className="navbar-brand" to="/">
                MHPlus: The Winning Submission
              </Link>
            </Navbar.Brand>
            <Nav.Link>
              <Link className="nav-link" to="/decks">
                Per Decks
              </Link>
            </Nav.Link>

            <Nav className="mr-auto"></Nav>
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
          <Switch>
            <Route exact path="/">
              <GamesApp
                isLoaded={this.state.isLoaded}
                error={this.state.error}
                matches={this.state.matches}
              />
            </Route>
            <Route path="/decks">
              <DecksApp
                isLoaded={this.state.isLoaded}
                error={this.state.error}
                matches={this.state.matches}
              />
            </Route>
          </Switch>
        </Container>
      </Router>
    );
  }
}

export default App;
