//function to format string to display custom error messages
const formatString = (arr) => {

    let str = '' //empty string to store allowed fields(for output formatting)
    for (let i = 0; i < arr.length - 1; i++) {
        str += arr[i] + ', '
    }
    str += arr[arr.length - 1]
    return str

}

const validate = (schema) => {
    return (req, res, next) => {
        try {

            //if schema not provided throw error
            if (!schema) {
                throw new AppError('schema is required', 400);
            }

            const allowedFields = schema.allowedFields
            const requiredFields = schema.requiredFields

            //if allowedfields provided as arguments and isnt undefined
            if (allowedFields && allowedFields.length > 0) {

                //convert allowed fields to string seperated by commas
                const allowed = formatString(allowedFields)

                // check for extra fields
                for (let key in req.body) {
                    if (!allowedFields.includes(key)) {
                        throw new AppError(`Only ${allowed} are allowed in req.body`, 400)
                    }
                }
            }

            //if requiredFields provided as arguments and isnt undefined
            if (requiredFields && requiredFields.length > 0) {

                //empty array to store missing fields and convert to string seperated by commas
                let required = []
                //check for missing fields
                for (let i = 0; i < requiredFields.length; i++) {
                    if (!req.body[requiredFields[i]]) {
                        required.push(requiredFields[i])
                    }
                }

                if (required.length !== 0) {
                    const missing = formatString(required)
                    throw new AppError(`Missing required fields: ${missing}`, 400)
                }
            }
            next()
        }
        catch (error) {
            next(error)
        }

    }

}


module.exports = validate;