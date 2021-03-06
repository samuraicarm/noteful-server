require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const { NODE_ENV } = require("./config");
const validateBearerToken = require("./validate-bearer-token");
const errorHandler = require("./error-handler");
const notefulRouter = require("./noteful/noteful-router");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(cors());
app.use(morgan(morganOption));

app.use(helmet());
app.use(validateBearerToken);

app.use("/api/noteful", notefulRouter);

app.use(errorHandler);

module.exports = app;
