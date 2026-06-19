const Registration = require('../models/Registration');
const Event = require('../models/Event');

// @desc    Register student for an event
// @route   POST /api/registrations
// @access  Student
exports.register = async (req, res, next) => {
  try {
    const { eventId } = req.body;
    const studentId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.status === 'cancelled' || event.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Registration is closed for this event' });
    }

    // Check registration deadline
    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: 'Registration deadline has passed' });
    }

    // Check capacity
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event is fully booked' });
    }

    // Check duplicate
    const existing = await Registration.findOne({ student: studentId, event: eventId });
    if (existing) {
      if (existing.status === 'cancelled') {
        // Allow re-registration
        existing.status = event.requiresApproval ? 'pending' : 'approved';
        existing.registrationDate = Date.now();
        await existing.save();
        await Event.findByIdAndUpdate(eventId, { $inc: { currentParticipants: 1 } });
        const populated = await Registration.findById(existing._id).populate('event');
        return res.json({ success: true, registration: populated, message: 'Re-registered successfully' });
      }
      return res.status(400).json({ success: false, message: 'You are already registered for this event' });
    }

    const status = event.requiresApproval ? 'pending' : 'approved';

    const registration = await Registration.create({
      student: studentId,
      event: eventId,
      status
    });

    // Increment participant count
    await Event.findByIdAndUpdate(eventId, { $inc: { currentParticipants: 1 } });

    const populated = await Registration.findById(registration._id).populate('event');

    res.status(201).json({
      success: true,
      registration: populated,
      message: status === 'pending' ? 'Registration submitted. Awaiting admin approval.' : 'Successfully registered!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current student's registrations
// @route   GET /api/registrations/my
// @access  Student
exports.getMyRegistrations = async (req, res, next) => {
  try {
    const registrations = await Registration.find({ student: req.user.id })
      .populate('event')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel own registration
// @route   DELETE /api/registrations/:id
// @access  Student
exports.cancelRegistration = async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    if (registration.student.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration is already cancelled' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement participant count
    await Event.findByIdAndUpdate(registration.event, { $inc: { currentParticipants: -1 } });

    res.json({ success: true, message: 'Registration cancelled successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registrations for an event (Admin)
// @route   GET /api/registrations/event/:eventId
// @access  Admin
exports.getEventParticipants = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = { event: req.params.eventId };
    if (status) query.status = status;

    const registrations = await Registration.find(query)
      .populate('student', 'name email studentId department semester phone')
      .populate('event', 'title date venue')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: registrations.length, registrations });
  } catch (error) {
    next(error);
  }
};

// @desc    Update registration status (Admin approve/reject)
// @route   PUT /api/registrations/:id/status
// @access  Admin
exports.updateRegistrationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const registration = await Registration.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('student', 'name email').populate('event', 'title');

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    res.json({ success: true, registration });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all registrations (Admin)
// @route   GET /api/registrations
// @access  Admin
exports.getAllRegistrations = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = status ? { status } : {};

    const total = await Registration.countDocuments(query);
    const registrations = await Registration.find(query)
      .populate('student', 'name email studentId department')
      .populate('event', 'title date venue category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: registrations.length,
      total,
      pages: Math.ceil(total / limit),
      registrations
    });
  } catch (error) {
    next(error);
  }
};
