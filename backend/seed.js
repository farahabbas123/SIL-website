// Moved to src/db/seed.js. This shim keeps `npm run seed` (if it
// still points here) and `require('../seed')` working.
const seed = require('./src/db/seed');

module.exports = seed;

if (require.main === module) {
    seed.runCli()
        .then(() => process.exit(0))
        .catch((err) => {
            console.error('Seed failed:', err);
            process.exit(1);
        });
}
