import React from 'react';
import './App.css';
import Accordion from 'react-bootstrap/Accordion'; //import the Accordion
import Card from 'react-bootstrap/Card';           //import the Card
import 'bootstrap/dist/css/bootstrap.min.css';     //import the bootstrap stylings


//the main location where all of the components of our application will come together.
//since we are using react-bootstrap and should be doing very little in the way of
//custom components most of it will be directly here and not in other files.
function App() {
  return (
    <div className="App">
      <header className="App-header">
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
      </header>
    </div>
  );
}

export default App;
