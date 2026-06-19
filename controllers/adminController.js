const Student = require('../models/Student');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalStudents,
      totalEvents,
      totalRegistrations,
      upcomingEvents,
      approvedRegistrations,
      pendingRegistrations,
      recentRegistrations,
      eventsByCategory,
      registrationsByDay
    ] = await Promise.all([
      Student.countDocuments({ isActive: true }),
      Event.countDocuments(),
      Registration.countDocuments({ status: { $ne: 'cancelled' } }),
      Event.countDocuments({ status: 'upcoming' }),
      Registration.countDocuments({ status: 'approved' }),
      Registration.countDocuments({ status: 'pending' }),
      Registration.find()
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('student', 'name email studentId department')
        .populate('event', 'title date category'),
      Event.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Registration.aggregate([
        {
          $match: {
            createdAt: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        totalStudents,
        totalEvents,
        totalRegistrations,
        upcomingEvents,
        approvedRegistrations,
        pendingRegistrations,
        recentRegistrations,
        eventsByCategory,
        registrationsByDay
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all students (Admin)
// @route   GET /api/admin/students
// @access  Admin
exports.getAllStudents = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, department } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } }
      ];
    }

    if (department) query.department = department;

    const total = await Student.countDocuments(query);
    const students = await Student.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    // Get registration counts for each student
    const studentsWithCounts = await Promise.all(
      students.map(async (student) => {
        const regCount = await Registration.countDocuments({
          student: student._id,
          status: { $ne: 'cancelled' }
        });
        return { ...student.toObject(), registrationCount: regCount };
      })
    );

    res.json({
      success: true,
      count: students.length,
      total,
      pages: Math.ceil(total / limit),
      students: studentsWithCounts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get report data
// @route   GET /api/admin/reports
// @access  Admin
exports.getReports = async (req, res, next) => {
  try {
    const [
      registrationsByStatus,
      topEvents,
      registrationsByDepartment,
      monthlyRegistrations
    ] = await Promise.all([
      Registration.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Event.find()
        .sort({ currentParticipants: -1 })
        .limit(5)
        .select('title category currentParticipants maxParticipants date'),
      Registration.aggregate([
        { $lookup: { from: 'students', localField: 'student', foreignField: '_id', as: 'studentData' } },
        { $unwind: '$studentData' },
        { $group: { _id: '$studentData.department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Registration.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 6 }
      ])
    ]);

    res.json({
      success: true,
      reports: {
        registrationsByStatus,
        topEvents,
        registrationsByDepartment,
        monthlyRegistrations: monthlyRegistrations.reverse()
      }
    });
  } catch (error) {
    next(error);
  }
};
