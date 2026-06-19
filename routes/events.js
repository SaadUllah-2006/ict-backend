const express = require('express');
const router = express.Router();
const {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  upload
} = require('../controllers/eventController');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/', getEvents);
router.get('/:id', getEvent);
router.post('/', protect, requireAdmin, upload.single('image'), createEvent);
router.put('/:id', protect, requireAdmin, upload.single('image'), updateEvent);
router.delete('/:id', protect, requireAdmin, deleteEvent);

module.exports = router;
