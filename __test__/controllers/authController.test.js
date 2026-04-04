const request = require('supertest');
const { connectToDatabase, disconnectFromDatabase, clearCollections } = require('../testDb');
const app = require('../testServer');
const User = require('../../models/User');
const bcrypt=require('bcryptjs')

beforeAll(async () => {
    await connectToDatabase();
});

afterEach(async () => {
    await clearCollections();
});

afterAll(async () => {
    await disconnectFromDatabase();
});

describe('Auth Controller tests', () => {

    //signup test cases 
    describe('Signup test cases:', () => {

        test('test signup with valid data', async () => {
            const data = {
                name: 'testName',
                email: 'test@email.com',
                password: 'test12345',
                gender: 'male'
            };
            const response = await request(app)
                .post('/api/auth/signup')
                .send(data);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Sign up successful');
        });

        test('test signup with duplicate email', async () => {

            const hashedPassword=await bcrypt.hash('test12345',10)
            await User.create({
                name: 'testName',
                email: 'test@email.com',
                password: hashedPassword,
                gender: 'male'
            });
            
            const data = {
                name: 'testName',
                email: 'test@email.com',
                password: 'test12345',
                gender: 'male'
            };
            const response = await request(app)
                .post('/api/auth/signup')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Email already exists');
        });

        test('test signup with missing fields', async () => {
            const data = {
                name: 'testName',
                password: 'test12345'
            };
            const response = await request(app)
                .post('/api/auth/signup')
                .send(data);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Missing required fields: email, gender');
        });
    });

    //login test cases 
    describe('Login test cases:', () => {

        beforeEach(async () => {
            const data = {
                name: 'testName',
                email: 'test@email.com',
                password: 'test12345',
                gender: 'male'
            };
            await request(app)
                .post('/api/auth/signup')
                .send(data);
        });

        test('test login with correct credentials', async () => {
            const data = {
                email: 'test@email.com',
                password: 'test12345'
            };
            const response = await request(app)
                .post('/api/auth/login')
                .send(data);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Login successful');
            expect(response.body.data).toHaveProperty('accessToken');
        });

        test('test login with incorrect password', async () => {
            const data = {
                email: 'test@email.com',
                password: 'test123'
            };
            const response = await request(app)
                .post('/api/auth/login')
                .send(data);

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Invalid Credentials');
        });
    });


    //refresh token test cases
    describe('Refresh Token test cases:', () => {

        let cookies;
        beforeEach(async () => {
            const data = {
                name: 'testName',
                email: 'test@email.com',
                password: 'test12345',
                gender: 'male'
            };

            //user signup 
            await request(app)
                .post('/api/auth/signup')
                .send(data);

            //login user to set refresh token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@email.com',
                    password: 'test12345'
                });
            cookies = loginResponse.headers['set-cookie'];
        });

        test('test refresh token with valid token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Cookie', cookies);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Token refreshed successfully');
            expect(response.body.data).toHaveProperty('accessToken');
        });

        test('test refresh token with missing token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Access Denied. No refresh token provided. Please login.');
        });
    });
});














