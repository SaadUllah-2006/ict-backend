const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('https://ict-frontend-sigma.vercel.app/register', register);
router.post('https://ict-frontend-sigma.vercel.app/login', login);
router.get('/me', protect, getMe);

module.exports = router;
