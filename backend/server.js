// ============================================================
// Entry point: load env -> apply migrations -> start listening.
// All app wiring lives in src/app.js.
// ============================================================

require('dotenv').config();

const app = require('./src/app');
const config = require('./src/config');
const { runMigrations } = require('./src/db/migrate');

// Bring the database schema up to date before accepting traffic.
runMigrations({ silent: false });

const server = app.listen(config.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running at http://localhost:${config.port} (${config.env})`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => {
        // eslint-disable-next-line no-console
        console.log(`\n${signal} received — shutting down.`);
        server.close(() => process.exit(0));
    });
}
