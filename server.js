const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');

const data = require('./routes/api/data');
const app = express();
const port = 9001;    //port the node server will be running on

//DB Setup
const db = require('./config/keys').mongoURI;
mongoose
  .connect(db)
  .then(() => console.log('Connected Successfully to db.'))
  .catch(err => console.log(err));

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

/* Spawn datasource listeners */