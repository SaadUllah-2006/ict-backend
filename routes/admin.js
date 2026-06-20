const express = require('express');
const router = express.Router();
const { getStats, getAllStudents, getReports } = require('../controllers/adminController');
const { protect, requireAdmin } = require('../middleware/auth');

router.use(protect, requireAdmin);

router.get('https://ict-frontend-sigma.vercel.app/stats', getStats);
router.get('https://ict-frontend-sigma.vercel.app/students', getAllStudents);
router.get('https://ict-frontend-sigma.vercel.app/reports', getReports);

module.exports = router;
