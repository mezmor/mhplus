const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const data = require('./routes/api/data');
const app = express();
const port = 9001;    //port the node server will be running on

//BodyParser Middleware
app.use(bodyParser.json());

//DB Config
const db = require('./config/keys').mongoURI;

//Connect to Mongo
mongoose
    .connect(db)
    .then(() => console.log('Connected Successfully to db.'))
    .catch(err => console.log(err));

    
//Set up Routes
app.use('/api/data', data);

//when we are done we will need to host this somewhere real
//this block of code will make it so we don't have to change 
//our code when we do an 'npm run build' instead of an 'npm start'
if (process.env.NODE_ENV === 'production'){
  app.use(express.static('src/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'src', 'build', 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});

console.log("Nonblocking");

/* Spawn datasource listeners */