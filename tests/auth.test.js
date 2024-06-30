const request = require('supertest');
const { app, createServer } = require('../src/index');

describe('Auth API', () => {
    let server;

    beforeAll(async () => {
        await createServer(); // Khởi tạo tài nguyên và khởi động server
        server = app.listen(3000); // Chạy server trên cổng 3000
    });

    afterAll(async () => {
        await server.close(); // Đóng server sau khi hoàn thành test
    });

    let refreshToken;
    let accessToken;

    test('should login and return access and refresh tokens', async () => {
        const response = await request(app)
            .post('/v1/api/auth/login')
            .send({
                email: 'user@gmail.com',
                password: 'abc123456'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('meta.access_token');
        expect(response.body).toHaveProperty('meta.refresh_token');

        accessToken = response.body.meta.access_token;
        refreshToken = response.body.meta.refresh_token;
    });

    test('should not allow login with invalid credentials', async () => {
        const response = await request(app)
            .post('/v1/api/auth/login')
            .send({ email: 'user@gmail.com', password: 'wrongpassword' });

        expect(response.status).toBe(403);
        expect(response.body).toHaveProperty('errors.message', 'Username or password is wrong');
    });

    test('should logout and invalidate the tokens', async () => {
        const response = await request(app)
            .post('/v1/api/auth/logout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send();

        expect(response.status).toBe(200);

        // Try to use the invalidated access token
        const protectedResponse = await request(app)
            .post('/v1/api/customer/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .send();

        expect(protectedResponse.status).toBe(401); // Should be unauthorized
    });

    test('should refresh access token using valid refresh token', async () => {
        // Log in again to get new tokens
        const loginResponse = await request(app)
            .post('/v1/api/auth/login')
            .send({
                email: 'user@gmail.com',
                password: 'abc123456'
            });

        expect(loginResponse.status).toBe(200);
        refreshToken = loginResponse.body.meta.refresh_token;

        const response = await request(app)
            .post('/v1/api/auth/refreshToken')
            .send({ refresh_token: refreshToken });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('data.accessToken');
        accessToken = response.body.data.accessToken; // Update the access token for further tests
    });

    test('should access protected route with new access token', async () => {
        const response = await request(app)
            .post('/v1/api/customer/list')
            .set('Authorization', `Bearer ${accessToken}`)
            .send();

        expect(response.status).toBe(200);
    });
});
