const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const db = require('./database');

const app = express();

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Serve the frontend website
app.use(express.static(path.join(__dirname, '../frontend')));

// ---------- Helpers ----------

// Blocks a route unless the request has a signed-in session.
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        return res.status(401).json({ error: 'You must be signed in to do that.' });
    }
    next();
}

// Strips the password hash before a user record is ever sent to the browser.
function toPublicUser(user) {
    return { id: user.id, name: user.name, email: user.email };
}

// ---------- Routes ----------

// Test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is working!' });
});

// Create account
app.post('/api/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                error: 'Please provide your name, email and password.'
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: 'Password must be at least 8 characters.'
            });
        }

        const existingUser = db
            .prepare('SELECT id FROM users WHERE email = ?')
            .get(email);

        if (existingUser) {
            return res.status(409).json({
                error: 'An account with this email already exists.'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const result = db.prepare(`
            INSERT INTO users (name, email, password_hash)
            VALUES (?, ?, ?)
        `).run(name, email, passwordHash);

        const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(result.lastInsertRowid);

        // Signing up also signs the user in.
        req.session.userId = user.id;

        res.status(201).json({
            message: 'Account created successfully.',
            user
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

// Sign in
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Please provide your email and password.'
            });
        }

        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ error: 'Incorrect email or password.' });
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Incorrect email or password.' });
        }

        req.session.userId = user.id;

        res.json({
            message: 'Signed in successfully.',
            user: toPublicUser(user)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

// Sign out
app.post('/api/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Could not sign out.' });
        }
        res.clearCookie('connect.sid');
        res.json({ message: 'Signed out successfully.' });
    });
});

// Get the signed-in user's own profile
app.get('/api/profile', requireAuth, (req, res) => {
    const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);

    if (!user) {
        return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user });
});

// Update name / email
function updateProfile(req, res) {
    try {
        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                error: 'Please provide your name and email.'
            });
        }

        const emailTaken = db
            .prepare('SELECT id FROM users WHERE email = ? AND id != ?')
            .get(email, req.session.userId);

        if (emailTaken) {
            return res.status(409).json({ error: 'That email is already in use.' });
        }

        db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?')
            .run(name, email, req.session.userId);

        const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(req.session.userId);

        res.json({ message: 'Profile updated.', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
}

// PUT and PATCH both fully replace/update the editable fields here, so
// both methods are supported and share the same handler.
app.put('/api/profile', requireAuth, updateProfile);
app.patch('/api/profile', requireAuth, updateProfile);

// Change password
app.put('/api/profile/password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                error: 'Please provide your current and new password.'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                error: 'New password must be at least 8 characters.'
            });
        }

        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
        const passwordMatches = await bcrypt.compare(currentPassword, user.password_hash);

        if (!passwordMatches) {
            return res.status(401).json({ error: 'Current password is incorrect.' });
        }

        const passwordHash = await bcrypt.hash(newPassword, 12);

        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .run(passwordHash, req.session.userId);

        res.json({ message: 'Password updated successfully.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

// Delete account
app.delete('/api/profile', requireAuth, (req, res) => {
    try {
        const userId = req.session.userId;

        db.prepare('DELETE FROM users WHERE id = ?').run(userId);

        req.session.destroy((error) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'Account deleted, but could not clear your session.' });
            }
            res.clearCookie('connect.sid');
            res.json({ message: 'Account deleted.' });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Something went wrong.' });
    }
});

module.exports = app;
