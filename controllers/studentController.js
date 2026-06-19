const Student = require('../models/Student');
const bcrypt = require('bcryptjs');

// @desc    Get student profile
// @route   GET /api/students/profile
// @access  Student
exports.getProfile = async (req, res, next) => {
  try {
    const student = await Student.findById(req.user.id).select('-password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, student });
  } catch (error) {
    next(error);
  }
};

// @desc    Update student profile
// @route   PUT /api/students/profile
// @access  Student
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, department, semester, phone } = req.body;

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      { name, department, semester, phone },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, student, message: 'Profile updated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/students/change-password
// @access  Student
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const student = await Student.findById(req.user.id).select('+password');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const isMatch = await student.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    student.password = newPassword;
    await student.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};
