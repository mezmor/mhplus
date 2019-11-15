import express, { static } from "express";
import { connect } from "mongoose";
import { json } from "body-parser";
import { resolve } from "path";

const data = require("./routes/api/data").default.default;
const app = express();
const port = 9001; //port the node server will be running on

//BodyParser Middleware
app.use(json());

//DB Config
import { mongoURI as db } from "./config/keys";

//Connect to Mongo
connect(db)
  .then(() => console.log("Connected Successfully to db."))
  .catch(err => console.log(err));

//Set up Routes
app.use("/api/data", data);

//when we are done we will need to host this somewhere real
//this block of code will make it so we don't have to change
//our code when we do an 'npm run build' instead of an 'npm start'
if (process.env.NODE_ENV === "production") {
  app.use(static("src/build"));

  app.get("*", (req, res) => {
    res.sendFile(resolve(__dirname, "src", "build", "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Server listening at ${port}`);
});

/* Spawn datasource listeners */
