const express = require('express');
const router = express.Router();
const { signup, login, refreshToken } = require('../controllers/authController');
const { signupSchema, loginSchema } = require('../schemas/authSchemas');
const validate = require('../middlewares/validate');
const authLimiter = require('../middlewares/authLimiter');

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', refreshToken);




module.exports = router;