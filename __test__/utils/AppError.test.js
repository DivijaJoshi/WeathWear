const AppError=require('../../utils/AppError')

describe('AppError class', () => {
  test('test error with different messages and status codes', () => {

    const error1=new AppError('test error 1',400)
    const error2=new AppError('test error 2',404)

    expect(error1.message).toBe('test error 1');
    expect(error1.code).toBe(400);

    expect(error2.message).toBe('test error 2');
    expect(error2.code).toBe(404);


  });

});