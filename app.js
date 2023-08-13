const express = require("express"); // web framework for node.js

const morgan = require("morgan"); //

const rateLimit = require("express-rate-limit"); // Basic rate-limiting middleware for Express. Use to limit repeated requests to public APIs and/or endpoints such as password reset.

const helmet = require("helmet"); //

const mongosanitize = require("express-mongo-sanitize"); // This module searches for any keys in objects that begin with a $ sign or contain a ., from req.body, req.query or req.params.

const bodyParser = require("body-parser"); // Node.js body parsing middleware.
const xss = require("xss-clean"); // Node.js Connect middleware to sanitize user input coming from POST body, GET queries, and url params.
const cors = require("cors"); // CORS is a node.js package for providing a Connect/Express middleware that can be used to enable CORS with various options.
const routes = require("./routes/index");
const app = express();
app.use(
  cors({
    origin: "*",

    methods: ["GET", "PATCH", "POST", "DELETE", "PUT"],

    credentials: true,
  })
);

//
app.use(express.json({ limit: "10kb" }));
// app.use(bodyParser.json());
app.use(express.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());

if (process.env.NODE_ENV === "dev") {
  app.use(morgan("dev"));
}
const limiter = rateLimit({
  max: 3000,
  windowMS: 60 * 60 * 1000, //In one hour 3000  request
  message: "Too many requests from this ip, please try again in one hour",
});
app.use("/tawk", limiter);

// app.use(
//   express.urlencoded({
//     extended: true,
//   })
// );

// app.use(mongosanitize());

// app.use(xss());
app.use(routes);
module.exports = app;
