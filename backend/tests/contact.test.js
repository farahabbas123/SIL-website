process.env.NODE_ENV = 'test';
process.env.DB_FILE = ':memory:';
process.env.SESSION_SECRET = 'test-secret';

const request = require('supertest');
const app = require('../src/app');
const { runMigrations } = require('../src/db/migrate');
const { seedTestUser, seedAdminUser, TEST_USER, ADMIN_USER } = require('../src/db/seed');

const api = '/api/v1';

let userAgent;
let adminAgent;

beforeAll(async () => {
    runMigrations({ silent: true });
    await seedTestUser();
    await seedAdminUser();

    userAgent = request.agent(app);
    await userAgent.post(`${api}/auth/login`).send({ email: TEST_USER.email, password: TEST_USER.password });

    adminAgent = request.agent(app);
    await adminAgent.post(`${api}/auth/login`).send({ email: ADMIN_USER.email, password: ADMIN_USER.password });
});

const sample = (overrides = {}) => ({
    name: 'Jamie Rivers',
    email: 'jamie@example.com',
    reason: 'General question',
    message: 'Hi — just wanted to ask about the opportunities board.',
    ...overrides,
});

describe('POST /api/v1/contact', () => {
    it('is public and persists a valid message', async () => {
        const res = await request(app).post(`${api}/contact`).send(sample());
        expect(res.status).toBe(201);
        expect(res.body.data.contactMessage).toMatchObject({
            name: 'Jamie Rivers',
            email: 'jamie@example.com',
            reason: 'General question',
        });
        expect(res.body.data.contactMessage).toHaveProperty('id');
    });

    it('rejects a missing message', async () => {
        const res = await request(app).post(`${api}/contact`).send(sample({ message: '' }));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects an invalid email', async () => {
        const res = await request(app).post(`${api}/contact`).send(sample({ email: 'not-an-email' }));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('allows an omitted reason', async () => {
        const res = await request(app).post(`${api}/contact`).send(sample({ reason: undefined }));
        expect(res.status).toBe(201);
        expect(res.body.data.contactMessage.reason).toBeNull();
    });
});

describe('GET /api/v1/contact', () => {
    it('rejects anonymous callers', async () => {
        const res = await request(app).get(`${api}/contact`);
        expect(res.status).toBe(401);
    });

    it('rejects non-admin users', async () => {
        const res = await userAgent.get(`${api}/contact`);
        expect(res.status).toBe(403);
    });

    it('lists messages for an admin', async () => {
        const res = await adminAgent.get(`${api}/contact`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.messages)).toBe(true);
        expect(res.body.meta).toHaveProperty('count');
        expect(res.body.data.messages.length).toBeGreaterThan(0);
    });
});

describe('GET /api/v1/contact/:id', () => {
    it('404s for a missing message (admin)', async () => {
        const res = await adminAgent.get(`${api}/contact/999999`);
        expect(res.status).toBe(404);
    });

    it('fetches one message (admin)', async () => {
        const created = await request(app).post(`${api}/contact`).send(sample({ name: 'Fetch Me' }));
        const id = created.body.data.contactMessage.id;

        const res = await adminAgent.get(`${api}/contact/${id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.contactMessage.name).toBe('Fetch Me');
    });
});
