const express = require('express');
const router = express.Router();
const { signup, login, refreshToken } = require('../controllers/authController');
const { signupSchema, loginSchema } = require('../schemas/authSchemas');
const validate = require('../middlewares/validate');

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', refreshToken);




module.exports = router;
