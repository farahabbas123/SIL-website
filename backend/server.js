// Loads variables from a .env file (if present) into process.env
// before anything else runs. Safe to keep even without a .env file —
// it just no-ops if the file doesn't exist.
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
