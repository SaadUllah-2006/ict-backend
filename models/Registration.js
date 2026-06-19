const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student reference is required']
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: [true, 'Event reference is required']
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'approved'
  },
  notes: {
    type: String,
    default: ''
  },
  attendanceMarked: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent duplicate registrations
RegistrationSchema.index({ student: 1, event: 1 }, { unique: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
