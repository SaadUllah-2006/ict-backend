const Student = require('../models/Student');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, department, semester, password, phone } = req.body;

    // Check if email already exists
    const existing = await Student.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    const student = await Student.create({
      name,
      email,
      department,
      semester: Number(semester), // ensure it's a number
      password,
      phone
    });

    const token = generateToken(student._id, 'student');

    res.status(201).json({
      success: true,
      token,
      user: {
        id: student._id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        department: student.department,
        semester: student.semester,
        role: 'student'
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login student or admin
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let user;
    const userRole = role || 'student';

    if (userRole === 'admin') {
      user = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    } else {
      user = await Student.findOne({ email: email.toLowerCase() }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, userRole);

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: userRole
    };

    if (userRole === 'student') {
      userData.studentId = user.studentId;
      userData.department = user.department;
      userData.semester = user.semester;
      userData.phone = user.phone;
    }

    res.json({ success: true, token, user: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    let user;
    if (req.user.role === 'admin') {
      user = await Admin.findById(req.user.id);
    } else {
      user = await Student.findById(req.user.id);
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: { ...user.toObject(), role: req.user.role }
    });
  } catch (error) {
    next(error);
  }
};
