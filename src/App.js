import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';     //import the bootstrap stylings
import Container from 'react-bootstrap/Container'; //import the bootstrap Container. to hold our data
import Row from 'react-bootstrap/Row';             //import the bootstrap Row; one for each deck played
import Col from 'react-bootstrap/Col';             //import the bootstrap Container; this will hold the deck info



//the main location where all of the components of our application will come together.
//since we are using react-bootstrap and should be doing very little in the way of
//custom components most of it will be directly here and not in other files.
function App() {
  
  let deckInfo = [{"name": "TeemoDeck", "data": "2-0"}, {"name": "EzrealDeck", "data": "0-1"}]; //create the array that will hold our information on the decks used

  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Row>
            <Col>Deck</Col>
            <Col>Deck Information</Col>
          </Row>
          {deckInfo.map(renderDeckInfo)}
        </Container>
      </header>
    </div>
  );
};

function renderDeckInfo(info, index){
  return (
    <Row>
      <Col>{info.name}</Col>
      <Col>{info.data}</Col>
    </Row>
  );
};

export default App;
