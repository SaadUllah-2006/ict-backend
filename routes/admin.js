const express = require('express');
const router = express.Router();
const { getStats, getAllStudents, getReports } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('/stats', getStats);
router.get('/students', getAllStudents);
router.get('/reports', getReports);

module.exports = router;
