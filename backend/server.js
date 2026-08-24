const express = require('express');
const path = require('path');
const db = require('./database');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve the frontend website
app.use(express.static(path.join(__dirname, '../frontend')));

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Create account
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check that all fields were provided
        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Please provide your name, email and password.'
            });
        }

        // Check password length
        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters.'
            });
        }

        // Check whether email already exists
        const existingUser = db
            .prepare('SELECT id FROM users WHERE email = ?')
            .get(email);

        if (existingUser) {
            return res.status(409).json({
                error: 'An account with this email already exists.'
            });
        }

        // Hash the password
        const passwordHash = await bcrypt.hash(password, 12);

        // Save the new user
        const result = db.prepare(`
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        `).run(name, email, passwordHash);

        res.status(201).json({
            message: 'Account created successfully.',
            userId: result.lastInsertRowid
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Something went wrong.'
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});