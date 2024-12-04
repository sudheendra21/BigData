const express = require("express");
const cors = require("cors");

const routes = require("./routes");

const app = express();

// Enable cors
app.use(cors());


// Middleware
app.use(express.json());

// register all the routes of the application
app.use('/v1', routes);

/**
 * Health Check API 
 * Method: GET
 */
app.get("/healthz", (_, res) => {
    const data = {
        message: 'OK!',
        date: new Date(),
        uptime: process.uptime(),
    }
    res.status(200).send(data);
});

module.exports = app;
