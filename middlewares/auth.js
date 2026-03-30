const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {

    //extract auth header : Bearer: token
    const authHeader = req.headers.authorization;

    //get refresh token from cookie
    const refreshToken = req.cookies['refreshToken'];


    //if both authHeader and refresh token not present, user not authenticated at all
    if (!authHeader && !refreshToken) {
        const error = new Error('Access denied. No token provided.');
        error.code = 401;
        return next(error);
    }


    let accessToken;


    //extract token if authHeader is not undefined (optional chaining operator so wont throw error,
    //  returns undefined 
    accessToken = authHeader?.split(' ')[1];


    //if token not present throw error
    if (!accessToken) {
        const error = new Error('Access denied. Invalid token format.');
        error.code = 401;
        return next(error);

    }

    try {
        //verify access token if not undefined
        const decoded = jwt.verify(accessToken, process.env.ACCESS_SECRET_KEY);
        //store payload in req.user so can be later accessed
        req.user = decoded;

        //call next middleware
        next();



    //if token not verfied or expired throws error and goes to catch block
    } catch (error) {

        //if no refresh token
        if (!refreshToken) {
            const err = new Error('Access Denied. No refresh token provided.');
            err.code = 401;
            return next(err);
        }

        try {
            //verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY);

            //generates new access token if refresh token verified
            const accessToken = jwt.sign({ id: decoded.id }, process.env.ACCESS_SECRET_KEY, { expiresIn: '1h' });
            req.user = decoded;

            res
                .cookie('refreshToken', refreshToken, { httpOnly: true, sameSite: 'strict' }) //reset cookie
                .header('Authorization', accessToken); //set new access token in auth header
            next();

        } catch (error) {
            
            //if no refresh token- ie expired, user needs to login again
            const err = new Error('Invalid Token.');
            err.code = 400;
            return next(err);
        }
    }
};


module.exports = auth;