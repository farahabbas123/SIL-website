// Isolated in-memory database for the whole file — never touches
// the real database.db. Must be set before requiring the app.
process.env.NODE_ENV = 'test';
process.env.DB_FILE = ':memory:';
process.env.SESSION_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { runMigrations } = require('../src/db/migrate');
const { seedTestUser, TEST_USER } = require('../src/db/seed');

const api = '/api/v1';

beforeAll(async () => {
    runMigrations({ silent: true });
    await seedTestUser();
});

// ------------------------------------------------------------
// Health
// ------------------------------------------------------------

describe('GET /api/v1/health', () => {
    it('reports ok in the standard envelope', async () => {
        const res = await request(app).get(`${api}/health`);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ success: true, data: { status: 'ok' } });
    });
});

describe('GET /api/v1/test (legacy health check)', () => {
    it('confirms the backend is running', async () => {
        const res = await request(app).get(`${api}/test`);
        expect(res.status).toBe(200);
        expect(res.body.data.message).toBe('Backend is working!');
    });
});

// ------------------------------------------------------------
// POST /api/v1/auth/register
// ------------------------------------------------------------

describe('POST /api/v1/auth/register', () => {
    it('rejects a request missing required fields', async () => {
        const res = await request(app).post(`${api}/auth/register`).send({ email: 'nofields@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(JSON.stringify(res.body.error.details)).toMatch(/name/i);
    });

    it('rejects a password under 8 characters', async () => {
        const res = await request(app).post(`${api}/auth/register`).send({
            name: 'Jane Doe',
            email: 'jane.short@example.com',
            password: 'short',
        });
        expect(res.status).toBe(400);
        expect(JSON.stringify(res.body.error.details)).toMatch(/at least 8 characters/i);
    });

    it('creates a new account and signs the user in', async () => {
        const agent = request.agent(app);
        const res = await agent.post(`${api}/auth/register`).send({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(201);
        expect(res.body.data.user).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com', role: 'user' });
        expect(res.body.data.user.password_hash).toBeUndefined();

        // register should have started a session
        const me = await agent.get(`${api}/users/me`);
        expect(me.status).toBe(200);
        expect(me.body.data.user.email).toBe('jane@example.com');
    });

    it('rejects a duplicate email', async () => {
        const res = await request(app).post(`${api}/auth/register`).send({
            name: 'Jane Doe Again',
            email: 'jane@example.com',
            password: 'password123',
        });
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('CONFLICT');
    });
});

// ------------------------------------------------------------
// POST /api/v1/auth/login
// ------------------------------------------------------------

describe('POST /api/v1/auth/login', () => {
    it('signs in the seeded test user', async () => {
        const res = await request(app).post(`${api}/auth/login`).send({
            email: TEST_USER.email,
            password: TEST_USER.password,
        });
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(TEST_USER.email);
        expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('rejects an email that does not exist', async () => {
        const res = await request(app).post(`${api}/auth/login`).send({
            email: 'nobody@example.com',
            password: 'whatever123',
        });
        expect(res.status).toBe(401);
    });

    it('rejects an incorrect password', async () => {
        const res = await request(app).post(`${api}/auth/login`).send({
            email: TEST_USER.email,
            password: 'wrong-password',
        });
        expect(res.status).toBe(401);
    });

    it('rejects a request missing email or password', async () => {
        const res = await request(app).post(`${api}/auth/login`).send({ email: TEST_USER.email });
        expect(res.status).toBe(400);
    });
});

// ------------------------------------------------------------
// GET /api/v1/users/me
// ------------------------------------------------------------

describe('GET /api/v1/users/me', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).get(`${api}/users/me`);
        expect(res.status).toBe(401);
    });

    it('returns the signed-in user once logged in', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.get(`${api}/users/me`);
        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe(TEST_USER.email);
    });
});

// ------------------------------------------------------------
// PUT / PATCH /api/v1/users/me
// ------------------------------------------------------------

describe('PUT /api/v1/users/me', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).put(`${api}/users/me`).send({ name: 'X', email: 'x@example.com' });
        expect(res.status).toBe(401);
    });

    it("updates the signed-in user's name and email", async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put(`${api}/users/me`).send({ name: 'Updated Name', email: TEST_USER.email });
        expect(res.status).toBe(200);
        expect(res.body.data.user.name).toBe('Updated Name');
    });

    it('rejects switching to an email already used by another account', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put(`${api}/users/me`).send({ name: 'Test User', email: 'jane@example.com' });
        expect(res.status).toBe(409);
    });
});

describe('PATCH /api/v1/users/me', () => {
    it('updates name and email the same way PUT does', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/register`).send({
            name: 'Patch Test',
            email: 'patch@example.com',
            password: 'password123',
        });

        const res = await agent.patch(`${api}/users/me`).send({ name: 'Patched Name', email: 'patch@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.name).toBe('Patched Name');
    });
});

// ------------------------------------------------------------
// PUT /api/v1/users/me/password
// ------------------------------------------------------------

describe('PUT /api/v1/users/me/password', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).put(`${api}/users/me/password`).send({
            currentPassword: '1',
            newPassword: 'newpassword123',
        });
        expect(res.status).toBe(401);
    });

    it('rejects the wrong current password', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put(`${api}/users/me/password`).send({
            currentPassword: 'not-the-current-password',
            newPassword: 'newpassword123',
        });
        expect(res.status).toBe(401);
    });

    it('rejects a new password under 8 characters', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put(`${api}/users/me/password`).send({
            currentPassword: TEST_USER.password,
            newPassword: 'short',
        });
        expect(res.status).toBe(400);
    });

    it('changes the password when the current password is correct', async () => {
        // Use a dedicated account so the shared TEST_USER stays usable.
        const agent = request.agent(app);
        await agent.post(`${api}/auth/register`).send({
            name: 'PW User',
            email: 'pw@example.com',
            password: 'password123',
        });

        const res = await agent.put(`${api}/users/me/password`).send({
            currentPassword: 'password123',
            newPassword: 'brand-new-password',
        });
        expect(res.status).toBe(200);

        const oldLogin = await request(app).post(`${api}/auth/login`).send({
            email: 'pw@example.com',
            password: 'password123',
        });
        expect(oldLogin.status).toBe(401);

        const newLogin = await request(app).post(`${api}/auth/login`).send({
            email: 'pw@example.com',
            password: 'brand-new-password',
        });
        expect(newLogin.status).toBe(200);
    });
});

// ------------------------------------------------------------
// DELETE /api/v1/users/me
// ------------------------------------------------------------

describe('DELETE /api/v1/users/me', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).delete(`${api}/users/me`);
        expect(res.status).toBe(401);
    });

    it('deletes the signed-in account and ends the session', async () => {
        const agent = request.agent(app);
        await agent.post(`${api}/auth/register`).send({
            name: 'Delete Me',
            email: 'deleteme@example.com',
            password: 'password123',
        });

        const res = await agent.delete(`${api}/users/me`);
        expect(res.status).toBe(200);

        const me = await agent.get(`${api}/users/me`);
        expect(me.status).toBe(401);

        const login = await request(app).post(`${api}/auth/login`).send({
            email: 'deleteme@example.com',
            password: 'password123',
        });
        expect(login.status).toBe(401);
    });
});

// ------------------------------------------------------------
// Password reset flow
// ------------------------------------------------------------

describe('POST /api/v1/auth/password-reset', () => {
    it('returns 200 with no token for an unknown email (no enumeration)', async () => {
        const res = await request(app).post(`${api}/auth/password-reset`).send({ email: 'ghost@example.com' });
        expect(res.status).toBe(200);
        expect(res.body.data.devToken).toBeUndefined();
    });

    it('issues a token for a known email and lets the user set a new password', async () => {
        await request(app).post(`${api}/auth/register`).send({
            name: 'Reset Me',
            email: 'reset@example.com',
            password: 'password123',
        });

        const requested = await request(app).post(`${api}/auth/password-reset`).send({ email: 'reset@example.com' });
        expect(requested.status).toBe(200);
        const token = requested.body.data.devToken;
        expect(token).toBeTruthy();

        const confirmed = await request(app).post(`${api}/auth/password-reset/confirm`).send({
            token,
            newPassword: 'a-totally-new-password',
        });
        expect(confirmed.status).toBe(200);

        const login = await request(app).post(`${api}/auth/login`).send({
            email: 'reset@example.com',
            password: 'a-totally-new-password',
        });
        expect(login.status).toBe(200);
    });

    it('rejects an invalid reset token', async () => {
        const res = await request(app).post(`${api}/auth/password-reset/confirm`).send({
            token: 'not-a-real-token',
            newPassword: 'whatever123',
        });
        expect(res.status).toBe(400);
    });
});
