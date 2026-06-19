const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Academic', 'Sports', 'Cultural', 'Technical', 'Workshop', 'Seminar', 'Competition', 'Other']
  },
  date: {
    type: Date,
    required: [true, 'Event date is required']
  },
  endDate: {
    type: Date
  },
  time: {
    type: String,
    default: '09:00 AM'
  },
  venue: {
    type: String,
    required: [true, 'Venue is required'],
    trim: true
  },
  organizer: {
    type: String,
    required: [true, 'Organizer is required'],
    trim: true
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Maximum participants is required'],
    min: [1, 'Must allow at least 1 participant']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
  },
  image: {
    type: String,
    default: ''
  },
  registrationDeadline: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  requiresApproval: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, { timestamps: true });

// Auto-update status based on date
EventSchema.pre('find', function () {
  const now = new Date();
  this.model.updateMany(
    { date: { $lt: now }, status: 'upcoming' },
    { status: 'ongoing' }
  ).exec();
});

module.exports = mongoose.model('Event', EventSchema);
