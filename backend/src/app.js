// ============================================================
// Express app assembly
// ------------------------------------------------------------
//   Request
//     -> CORS -> request logger -> JSON body parser -> session
//     -> static frontend
//     -> /api/v1 router  (route -> controller -> service -> repository -> DB)
//     -> 404 handler
//     -> error handler   (ApiError -> standard error envelope)
//
// No server is started here — server.js does that. Tests import
// this module directly so they never bind a port.
// ============================================================

const path = require('path');
const express = require('express');
const session = require('express-session');

const config = require('./config');
const cors = require('./middleware/cors');
const requestLogger = require('./middleware/requestLogger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
const apiV1 = require('./routes');

const app = express();

// Behind a proxy (e.g. Nginx) in production so secure cookies work.
if (config.isProd) app.set('trust proxy', 1);

app.use(cors);
app.use(requestLogger);
app.use(express.json());

app.use(
    session({
        name: 'connect.sid',
        secret: config.sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            sameSite: 'lax',
            secure: config.isProd,
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
    })
);

// Serve the static frontend from the same origin as the API.
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// API — versioned, with an unversioned alias for convenience.
app.use('/api/v1', apiV1);
app.use('/api', apiV1);

// Anything unmatched → standard 404, then the error handler.
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
