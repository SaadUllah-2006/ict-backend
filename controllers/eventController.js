const Event = require('../models/Event');
const Registration = require('../models/Registration');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/events');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `event-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  }
});
exports.upload = upload;

// @desc    Get all events with search and filters
// @route   GET /api/events
// @access  Public
exports.getEvents = async (req, res, next) => {
  try {
    const { search, category, status, dateFrom, dateTo, page = 1, limit = 12 } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'All') query.category = category;
    if (status) query.status = status;

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: events.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      events
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Get registration count
    const registrationCount = await Registration.countDocuments({
      event: event._id,
      status: { $ne: 'cancelled' }
    });

    res.json({ success: true, event: { ...event.toObject(), registrationCount } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create event
// @route   POST /api/events
// @access  Admin
exports.createEvent = async (req, res, next) => {
  try {
    const { title, description, category, date, endDate, time, venue, organizer, maxParticipants, registrationDeadline, tags, requiresApproval } = req.body;

    const eventData = {
      title, description, category, date, endDate, time, venue, organizer,
      maxParticipants: Number(maxParticipants),
      registrationDeadline,
      requiresApproval: requiresApproval === 'true' || requiresApproval === true,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
      createdBy: req.user.id
    };

    if (req.file) {
      eventData.image = `/uploads/events/${req.file.filename}`;
    }

    const event = await Event.create(eventData);

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Admin
exports.updateEvent = async (req, res, next) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const updateData = { ...req.body };
    if (updateData.maxParticipants) updateData.maxParticipants = Number(updateData.maxParticipants);
    if (updateData.tags && typeof updateData.tags === 'string') {
      updateData.tags = updateData.tags.split(',').map(t => t.trim());
    }
    if (req.file) {
      updateData.image = `/uploads/events/${req.file.filename}`;
    }

    event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });

    res.json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Admin
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Cancel all registrations for this event
    await Registration.updateMany({ event: event._id }, { status: 'cancelled' });

    await Event.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    next(error);
  }
};
