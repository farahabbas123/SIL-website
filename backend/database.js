// Moved to src/db/connection.js. Schema now lives in migrations
// (src/db/migrations/*.sql). This shim keeps `require('./database')`
// working for any older import.
module.exports = require('./src/db/connection');
