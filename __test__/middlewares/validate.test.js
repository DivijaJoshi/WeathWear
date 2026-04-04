const validate = require('../../middlewares/validate')
const AppError = require('../../utils/AppError')


const testSchema = {
    allowedFields: ['name', 'email', 'password'],
    requiredFields: ['name', 'email', 'password']
}

describe('Validation middleware tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = {}
        res = {}
        next = jest.fn();
    });


    test('test validation middleware with correct fields', () => {

        req.body = {
            name: 'testName',
            email: 'test@email.com',
            password: 'test123'
        }
        const middleware = validate(testSchema) //returns middleware
        //call middleware
        middleware(req, res, next)

        expect(next).toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);

    });

    test('test validation middleware with missing fields', () => {

        req.body = {
            name: 'testName',
            email: 'test@email.com',
        }
        const middleware = validate(testSchema) //returns middleware
        //call middleware
        middleware(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.code).toBe(400);
        expect(error.message).toBe("Missing required fields: password");

    });

    test('test validation middleware with extra fields', () => {

        req.body = {
            name: 'testName',
            email: 'test@email.com',
            abc: 10
        }
        const middleware = validate(testSchema) //returns middleware
        //call middleware
        middleware(req, res, next)

        expect(next).toHaveBeenCalledWith(expect.any(AppError));
        const error = next.mock.calls[0][0];
        expect(error.code).toBe(400);
        expect(error.message).toBe("Only name, email, password are allowed in req.body");

    });

});