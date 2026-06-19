const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/studentController');
const { protect, requireStudent } = require('../middleware/auth');

router.use(protect, requireStudent);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

module.exports = router;
