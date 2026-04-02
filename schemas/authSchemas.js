const signupSchema = {
    allowedFields: ['name', 'email', 'password', 'gender'],
    requiredFields: ['name', 'email', 'password', 'gender']
};

const loginSchema = {
    allowedFields: ['email', 'password'],
    requiredFields: ['email', 'password']
};

module.exports = { signupSchema, loginSchema };

