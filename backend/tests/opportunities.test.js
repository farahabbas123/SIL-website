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
    name: 'Rhodes Scholarship',
    location: 'University of Oxford, UK',
    type: 'postgrad-research',
    closingDate: '2027-08-03',
    url: 'https://www.rhodeshouse.ox.ac.uk/',
    ...overrides,
});

describe('GET /api/v1/opportunities', () => {
    it('is public and returns an array with a count', async () => {
        const res = await request(app).get(`${api}/opportunities`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.opportunities)).toBe(true);
        expect(res.body.meta).toHaveProperty('count');
    });
});

describe('POST /api/v1/opportunities', () => {
    it('rejects anonymous callers', async () => {
        const res = await request(app).post(`${api}/opportunities`).send(sample());
        expect(res.status).toBe(401);
    });

    it('rejects non-admin users', async () => {
        const res = await userAgent.post(`${api}/opportunities`).send(sample());
        expect(res.status).toBe(403);
    });

    it('rejects invalid data from an admin', async () => {
        const res = await adminAgent.post(`${api}/opportunities`).send(sample({ type: 'nonsense', url: 'not-a-url' }));
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('creates an opportunity for an admin and computes closingSoon', async () => {
        const res = await adminAgent.post(`${api}/opportunities`).send(sample());
        expect(res.status).toBe(201);
        expect(res.body.data.opportunity).toMatchObject({
            name: 'Rhodes Scholarship',
            type: 'postgrad-research',
        });
        expect(res.body.data.opportunity).toHaveProperty('closingSoon');
        expect(res.body.data.opportunity.closingSoon).toBe(false); // 2027-08-03 is far out
    });
});

describe('GET /api/v1/opportunities/:id', () => {
    it('404s for a missing opportunity', async () => {
        const res = await request(app).get(`${api}/opportunities/999999`);
        expect(res.status).toBe(404);
    });
});

describe('filtering', () => {
    beforeAll(async () => {
        await adminAgent.post(`${api}/opportunities`).send(sample({ name: 'Short Course X', type: 'short-course', closingDate: null }));
        const soon = new Date(Date.now() + 5 * 86_400_000).toISOString().slice(0, 10);
        await adminAgent.post(`${api}/opportunities`).send(sample({ name: 'Closing Soon Y', closingDate: soon }));
    });

    it('filters by type', async () => {
        const res = await request(app).get(`${api}/opportunities?type=short-course`);
        expect(res.status).toBe(200);
        expect(res.body.data.opportunities.length).toBeGreaterThan(0);
        expect(res.body.data.opportunities.every((o) => o.type === 'short-course')).toBe(true);
    });

    it('filters to closing-soon listings', async () => {
        const res = await request(app).get(`${api}/opportunities?soon=true`);
        expect(res.status).toBe(200);
        expect(res.body.data.opportunities.length).toBeGreaterThan(0);
        expect(res.body.data.opportunities.every((o) => o.closingSoon === true)).toBe(true);
    });
});

describe('PUT / PATCH / DELETE /api/v1/opportunities/:id', () => {
    let id;

    beforeAll(async () => {
        const res = await adminAgent.post(`${api}/opportunities`).send(sample({ name: 'Editable Z' }));
        id = res.body.data.opportunity.id;
    });

    it('PATCH updates a single field (admin)', async () => {
        const res = await adminAgent.patch(`${api}/opportunities/${id}`).send({ location: 'Cambridge, UK' });
        expect(res.status).toBe(200);
        expect(res.body.data.opportunity.location).toBe('Cambridge, UK');
        expect(res.body.data.opportunity.name).toBe('Editable Z'); // untouched
    });

    it('PUT requires admin', async () => {
        const res = await userAgent.put(`${api}/opportunities/${id}`).send(sample());
        expect(res.status).toBe(403);
    });

    it('DELETE removes it (admin), then GET 404s', async () => {
        const del = await adminAgent.delete(`${api}/opportunities/${id}`);
        expect(del.status).toBe(200);

        const after = await request(app).get(`${api}/opportunities/${id}`);
        expect(after.status).toBe(404);
    });
});
