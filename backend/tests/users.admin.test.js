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

describe('GET /api/v1/users (admin only)', () => {
    it('rejects a non-admin with 403', async () => {
        const res = await userAgent.get(`${api}/users`);
        expect(res.status).toBe(403);
    });

    it('rejects an anonymous caller with 401', async () => {
        const res = await request(app).get(`${api}/users`);
        expect(res.status).toBe(401);
    });

    it('returns the user list for an admin', async () => {
        const res = await adminAgent.get(`${api}/users`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data.users)).toBe(true);
        expect(res.body.data.users.some((u) => u.email === ADMIN_USER.email)).toBe(true);
        // never leak the hash
        expect(res.body.data.users.every((u) => u.password_hash === undefined)).toBe(true);
    });
});

describe('PATCH /api/v1/users/:id/role (admin only)', () => {
    it('promotes a user to admin', async () => {
        const list = await adminAgent.get(`${api}/users`);
        const target = list.body.data.users.find((u) => u.email === TEST_USER.email);

        const res = await adminAgent.patch(`${api}/users/${target.id}/role`).send({ role: 'admin' });
        expect(res.status).toBe(200);
        expect(res.body.data.user.role).toBe('admin');
    });

    it('rejects an invalid role', async () => {
        const list = await adminAgent.get(`${api}/users`);
        const target = list.body.data.users.find((u) => u.email === TEST_USER.email);

        const res = await adminAgent.patch(`${api}/users/${target.id}/role`).send({ role: 'superuser' });
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('stops an admin from removing their own admin role', async () => {
        const me = await adminAgent.get(`${api}/users`);
        const self = me.body.data.users.find((u) => u.email === ADMIN_USER.email);

        const res = await adminAgent.patch(`${api}/users/${self.id}/role`).send({ role: 'user' });
        expect(res.status).toBe(400);
    });
});
