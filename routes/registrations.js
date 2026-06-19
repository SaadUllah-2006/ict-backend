const express = require('express');
const router = express.Router();
const {
  register,
  getMyRegistrations,
  cancelRegistration,
  getEventParticipants,
  updateRegistrationStatus,
  getAllRegistrations
} = require('../controllers/registrationController');
const { protect, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/', protect, requireAdmin, getAllRegistrations);
router.post('/', protect, requireStudent, register);
router.get('/my', protect, requireStudent, getMyRegistrations);
router.delete('/:id', protect, requireStudent, cancelRegistration);
router.get('/event/:eventId', protect, requireAdmin, getEventParticipants);
router.put('/:id/status', protect, requireAdmin, updateRegistrationStatus);

module.exports = router;
