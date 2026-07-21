const Joi = require('joi');
const mongoose = require('mongoose');

const Attendance = mongoose.model('Attendance');
const Admin = mongoose.model('Admin');

const schema = Joi.object({
  employee: Joi.string().required(),
  attendanceDate: Joi.date().required(),
  status: Joi.string()
    .valid('present', 'absent', 'late', 'half_day', 'leave', 'work_from_home')
    .required(),
  workMode: Joi.string().valid('office', 'remote', 'hybrid', 'field').allow('', null).default('office'),
  checkIn: Joi.string().allow('', null),
  checkOut: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const getDateRange = (dateInput) => {
  const currentDate = new Date(dateInput);
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

const normalizeAttendanceValues = (value) => {
  const normalized = { ...value };

  if (['absent', 'leave'].includes(normalized.status)) {
    normalized.workMode = null;
    normalized.checkIn = '';
    normalized.checkOut = '';
    normalized.sessionStatus = 'closed';
    return normalized;
  }

  normalized.sessionStatus = normalized.checkOut ? 'closed' : 'active';
  return normalized;
};

const update = async (req, res) => {
  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.details[0]?.message,
    });
  }

  const employee = await Admin.findOne({
    _id: value.employee,
    removed: false,
    enabled: true,
  }).lean();

  if (!employee) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Employee not found.',
    });
  }

  const { startOfDay, endOfDay } = getDateRange(value.attendanceDate);
  const existingAttendance = await Attendance.findOne({
    _id: { $ne: req.params.id },
    employee: employee._id,
    attendanceDate: { $gte: startOfDay, $lte: endOfDay },
    removed: false,
  }).lean();

  if (existingAttendance) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Attendance already exists for this employee on the selected date.',
    });
  }

  const employeeName = [employee.name, employee.surname].filter(Boolean).join(' ').trim();
  const normalizedValue = normalizeAttendanceValues(value);

  const result = await Attendance.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    {
      $set: {
        ...normalizedValue,
        employee: employee._id,
        employeeIdSnapshot: employee.employeeId,
        employeeName,
        updated: new Date(),
        removed: false,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Attendance not found.',
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Attendance updated successfully',
  });
};

module.exports = update;
