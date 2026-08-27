// Use an isolated in-memory database for the whole test run so tests
// never touch the real database.db file used in development.
process.env.DB_FILE = ':memory:';
process.env.SESSION_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const { seedTestUser, TEST_USER } = require('../seed');

beforeAll(async () => {
    await seedTestUser();
});

describe('GET /api/test', () => {
    it('confirms the backend is running', async () => {
        const res = await request(app).get('/api/test');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Backend is working!');
    });
});

describe('POST /api/signup', () => {
    it('rejects a request missing required fields', async () => {
        const res = await request(app).post('/api/signup').send({ email: 'nofields@example.com' });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/name, email and password/i);
    });

    it('rejects a password under 8 characters', async () => {
        const res = await request(app).post('/api/signup').send({
            name: 'Jane Doe',
            email: 'jane.short@example.com',
            password: 'short'
        });
        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/at least 8 characters/i);
    });

    it('creates a new account and signs the user in', async () => {
        const agent = request.agent(app);
        const res = await agent.post('/api/signup').send({
            name: 'Jane Doe',
            email: 'jane@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(201);
        expect(res.body.user).toMatchObject({ name: 'Jane Doe', email: 'jane@example.com' });
        expect(res.body.user.password_hash).toBeUndefined();

        // signup should have started a session — profile should be reachable immediately
        const profileRes = await agent.get('/api/profile');
        expect(profileRes.status).toBe(200);
        expect(profileRes.body.user.email).toBe('jane@example.com');
    });

    it('rejects a duplicate email', async () => {
        const res = await request(app).post('/api/signup').send({
            name: 'Jane Doe Again',
            email: 'jane@example.com',
            password: 'password123'
        });
        expect(res.status).toBe(409);
        expect(res.body.error).toMatch(/already exists/i);
    });
});

describe('POST /api/login', () => {
    it('signs in the seeded test user', async () => {
        const res = await request(app).post('/api/login').send({
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(TEST_USER.email);
        expect(res.body.user.password_hash).toBeUndefined();
    });

    it('rejects an email that does not exist', async () => {
        const res = await request(app).post('/api/login').send({
            email: 'nobody@example.com',
            password: 'whatever123'
        });
        expect(res.status).toBe(401);
    });

    it('rejects an incorrect password', async () => {
        const res = await request(app).post('/api/login').send({
            email: TEST_USER.email,
            password: 'wrong-password'
        });
        expect(res.status).toBe(401);
    });

    it('rejects a request missing email or password', async () => {
        const res = await request(app).post('/api/login').send({ email: TEST_USER.email });
        expect(res.status).toBe(400);
    });
});

describe('GET /api/profile', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).get('/api/profile');
        expect(res.status).toBe(401);
    });

    it('returns the signed-in user once logged in', async () => {
        const agent = request.agent(app); // persists the session cookie across requests
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.get('/api/profile');
        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe(TEST_USER.email);
    });
});

describe('PUT /api/profile', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).put('/api/profile').send({ name: 'X', email: 'x@example.com' });
        expect(res.status).toBe(401);
    });

    it('updates the signed-in user\'s name and email', async () => {
        const agent = request.agent(app);
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put('/api/profile').send({
            name: 'Updated Name',
            email: TEST_USER.email
        });
        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe('Updated Name');
    });

    it('rejects switching to an email already used by another account', async () => {
        const agent = request.agent(app);
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put('/api/profile').send({
            name: 'Test User',
            email: 'jane@example.com' // taken in an earlier test
        });
        expect(res.status).toBe(409);
    });
});

describe('PUT /api/profile/password', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).put('/api/profile/password').send({
            currentPassword: '1',
            newPassword: 'newpassword123'
        });
        expect(res.status).toBe(401);
    });

    it('rejects the wrong current password', async () => {
        const agent = request.agent(app);
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put('/api/profile/password').send({
            currentPassword: 'not-the-current-password',
            newPassword: 'newpassword123'
        });
        expect(res.status).toBe(401);
    });

    it('rejects a new password under 8 characters', async () => {
        const agent = request.agent(app);
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put('/api/profile/password').send({
            currentPassword: TEST_USER.password,
            newPassword: 'short'
        });
        expect(res.status).toBe(400);
    });

    it('changes the password when the current password is correct', async () => {
        const agent = request.agent(app);
        await agent.post('/api/login').send({ email: TEST_USER.email, password: TEST_USER.password });

        const res = await agent.put('/api/profile/password').send({
            currentPassword: TEST_USER.password,
            newPassword: 'brand-new-password'
        });
        expect(res.status).toBe(200);

        // old password should no longer work
        const oldLogin = await request(app).post('/api/login').send({
            email: TEST_USER.email,
            password: TEST_USER.password
        });
        expect(oldLogin.status).toBe(401);

        // new password should work
        const newLogin = await request(app).post('/api/login').send({
            email: TEST_USER.email,
            password: 'brand-new-password'
        });
        expect(newLogin.status).toBe(200);
    });
});

describe('PATCH /api/profile', () => {
    it('updates name and email the same way PUT does', async () => {
        const agent = request.agent(app);
        await agent.post('/api/signup').send({
            name: 'Patch Test',
            email: 'patch@example.com',
            password: 'password123'
        });

        const res = await agent.patch('/api/profile').send({
            name: 'Patched Name',
            email: 'patch@example.com'
        });
        expect(res.status).toBe(200);
        expect(res.body.user.name).toBe('Patched Name');
    });
});

describe('DELETE /api/profile', () => {
    it('blocks unauthenticated requests', async () => {
        const res = await request(app).delete('/api/profile');
        expect(res.status).toBe(401);
    });

    it('deletes the signed-in account and ends the session', async () => {
        const agent = request.agent(app);
        await agent.post('/api/signup').send({
            name: 'Delete Me',
            email: 'deleteme@example.com',
            password: 'password123'
        });

        const res = await agent.delete('/api/profile');
        expect(res.status).toBe(200);

        // session should be gone — profile should now be unreachable
        const profileRes = await agent.get('/api/profile');
        expect(profileRes.status).toBe(401);

        // logging in with the deleted account should fail
        const loginRes = await request(app).post('/api/login').send({
            email: 'deleteme@example.com',
            password: 'password123'
        });
        expect(loginRes.status).toBe(401);
    });
});
