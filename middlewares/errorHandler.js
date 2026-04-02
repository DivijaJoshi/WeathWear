const errorHandler = (error, req, res, next) => {

    //  Mongoose ValidationError
    if (error.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired. Please login again.'
        });
    }

    if (error.name === 'JsonWebTokenError') {
        return res.status(403).json({
            error: 'Invalid token.'
        });
    }

    if (typeof error.code === 'string') {
        return res.status(400).json({ error: { message: error.message } });
    }



    //Handle all errors defined by accessing error object
    return res.status(error.code || 500).json({
        error: {
            message: error.message || 'Internal server error',
            statusCode: error.code,
        }
    });



};

module.exports = errorHandler;