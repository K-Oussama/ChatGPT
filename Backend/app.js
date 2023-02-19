// app.js
const cors = require("cors");
const express = require("express");
//const redis = require("./redis");
const apiRouter = require("./api");

const app = express();

// Allow cross-origin requests
app.use(cors());


// Parse incoming JSON requests
app.use(express.json());


// Mount the API router
app.use("/api", apiRouter);

// Start the server
app.listen(5000, () => {
  console.log("Server listening on port 5000");
});