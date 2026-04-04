const request = require('supertest');
const { connectToDatabase, disconnectFromDatabase, clearCollections } = require('../testDb');
const app = require('../testServer');
const User = require('../../models/User');
const Closet = require('../../models/Closet')
const bcrypt = require('bcryptjs')
const path = require('path');

jest.mock('../../config/gemini', () => ({
    ai: {
        files: {
            upload: jest.fn().mockResolvedValue({
                uri: 'mock://gemini/file',
                mimeType: 'image/jpeg'
            })
        }
    }
}));

jest.mock('../../config/cloudinary', () => ({
    uploader: {
        upload: jest.fn().mockResolvedValue({
            secure_url: 'http://mock.cloudinary.com/image.jpg',
            public_id: 'mock_public_id'
        }),
        destroy: jest.fn().mockResolvedValue({ result: 'ok' })
    }
}));

jest.mock('../../producers/AnalyserProducer', () => jest.fn().mockResolvedValue(true));




beforeAll(async () => {
    await connectToDatabase();
});

afterEach(async () => {
    await clearCollections();
});

afterAll(async () => {
    await disconnectFromDatabase();
});

describe('User Controller CRUD tests', () => {

    let accessToken, userId

    beforeEach(async () => {

        //create user
        const hashedPassword = await bcrypt.hash('test12345', 10)
        const user = await User.create({
            name: 'testName',
            email: 'test1@email.com',
            password: hashedPassword,
            gender: 'male'
        });

        userId = user._id

        //login user
        const data = {
            email: 'test1@email.com',
            password: 'test12345'
        };
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send(data);

        //get access token
        accessToken = loginResponse.body.data.accessToken



    })


    //test add clothes endpoint
    describe('test Add Clothes endpoint', () => {

        test('test add clothes with valid data', async () => {
            const imagePath = path.join(__dirname, '../../testOutfitImages/1000327054.jpg')

            const response = await request(app)
                .post('/api/user/addClothes')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('clothingName', 'test clothing')
                .field('clothingType', 'Top')
                .field('clothingMaterial', 'Cotton')
                .field('comfort', '4')
                .attach('image', imagePath)


            expect(response.status).toBe(201)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('New clothing added to closet, clothing analysis in progress.')

            //check if clothing added to closet
            const clothing = await Closet.findOne({ clothingName: 'test clothing', userId: userId })
            expect(clothing).not.toBeNull()
        })


        test('test add clothes with missing fields', async () => {
            const imagePath = path.join(__dirname, '../../testOutfitImages/1000327054.jpg')

            const response = await request(app)
                .post('/api/user/addClothes')
                .set('Authorization', `Bearer ${accessToken}`)
                .field('clothingName', 'test clothing')
                .field('clothingType', 'Top')
                .field('clothingMaterial', 'Cotton')
                .attach('image', imagePath)


            expect(response.status).toBe(400)
            expect(response.body.success).toBe(false)
            expect(response.body.message).toBe('Missing required fields: comfort')

        })


    });




    //test get closet endpoint
    describe('test Get Closet endpoint', () => {

        test('test get closet with clothing data', async () => {

            await Closet.create({
                clothingName: 'Blue Shirt',
                clothingType: 'Top',
                clothingMaterial: 'Cotton',
                comfort: 4,
                userId: userId,
                imageURI: 'http://example.com/image1.jpg',
                cloudinaryPublicId: 'test_id1'
            })

            const response = await request(app)
                .get('/api/user/getCloset')
                .set('Authorization', `Bearer ${accessToken}`)


            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Closet fetched successfully')
            expect(response.body.data.closet).toHaveLength(1)


        })

        test('test get closet without bearer token', async () => {

            await Closet.create({
                clothingName: 'Blue Shirt',
                clothingType: 'Top',
                clothingMaterial: 'Cotton',
                comfort: 4,
                userId: userId,
                imageURI: 'http://example.com/image1.jpg',
                cloudinaryPublicId: 'test_id1'
            })

            const response = await request(app)
                .get('/api/user/getCloset')


            expect(response.status).toBe(401)
            expect(response.body.success).toBe(false)

        })

        test('test get closet with empty closet', async () => {



            const response = await request(app)
                .get('/api/user/getCloset')
                .set('Authorization', `Bearer ${accessToken}`)



            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.data.closet).toHaveLength(0)


        })
    })


    //test delete clothing endpoint
    describe('test delete Clothing endpoint', () => {

        test('test delete clothing by id', async () => {

            const clothing = await Closet.create({
                clothingName: 'Blue Shirt test',
                clothingType: 'Top',
                clothingMaterial: 'Cotton',
                comfort: 4,
                userId: userId,
                imageURI: 'http://example.com/image1.jpg',
                cloudinaryPublicId: 'test_id1'
            })

            let clothingId = clothing._id
            const response = await request(app)
                .delete(`/api/user/deleteClothes/${clothingId}`)
                .set('Authorization', `Bearer ${accessToken}`)


            expect(response.status).toBe(200)
            expect(response.body.success).toBe(true)
            expect(response.body.message).toBe('Clothing deleted successfully')




        })

        test('test delete clothing by id without bearer token', async () => {

            const clothing = await Closet.create({
                clothingName: 'red top',
                clothingType: 'Top',
                clothingMaterial: 'Cotton',
                comfort: 4,
                userId: userId,
                imageURI: 'http://example.com/image1.jpg',
                cloudinaryPublicId: 'test_id1'
            })

            let clothingId = clothing._id
            const response = await request(app)
                .delete(`/api/user/deleteClothes/${clothingId}`)

            expect(response.status).toBe(401)
        })


        test('test delete clothing by id with invalid id', async () => {

            const response = await request(app)
                .delete('/api/user/deleteClothes/1234')
                .set('Authorization', `Bearer ${accessToken}`)


            expect(response.status).toBe(400)




        })


    })



})
