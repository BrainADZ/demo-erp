const Joi = require('joi');
const mongoose = require('mongoose');

const Attendance = mongoose.model('Attendance');
const Admin = mongoose.model('Admin');

const schema = Joi.object({
  employee: Joi.string().required(),
  attendanceDate: Joi.date().allow(null),
  leaveDateRange: Joi.array().items(Joi.date().required()).length(2),
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

const formatDateKey = (dateInput) => {
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDatesBetween = ([startInput, endInput]) => {
  const start = new Date(startInput);
  const end = new Date(endInput);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return [];

  const dates = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
};

const normalizeAttendanceValues = (value) => {
  const normalized = {
    ...value,
  };
  delete normalized.leaveDateRange;

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

const create = async (req, res) => {
  const { error, value } = schema.validate(req.body, { stripUnknown: true });
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.details[0]?.message,
    });
  }

  const isLeaveRange = value.status === 'leave' && Array.isArray(value.leaveDateRange);
  const datesToCreate = isLeaveRange
    ? getDatesBetween(value.leaveDateRange)
    : value.attendanceDate
    ? [new Date(value.attendanceDate)]
    : [];

  if (!datesToCreate.length) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Please select a valid attendance date.',
    });
  }

  if (datesToCreate.length > 60) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Leave range cannot be longer than 60 days.',
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

  const { startOfDay } = getDateRange(datesToCreate[0]);
  const { endOfDay } = getDateRange(datesToCreate[datesToCreate.length - 1]);
  const existingAttendances = await Attendance.find({
    employee: employee._id,
    attendanceDate: { $gte: startOfDay, $lte: endOfDay },
    removed: false,
  }).lean();

  const existingDateKeys = new Set(
    existingAttendances.map((attendance) => formatDateKey(attendance.attendanceDate))
  );
  const duplicateDates = datesToCreate
    .filter((date) => existingDateKeys.has(formatDateKey(date)))
    .map(formatDateKey);

  if (duplicateDates.length) {
    return res.status(409).json({
      success: false,
      result: null,
      message: `Attendance already exists for: ${duplicateDates.join(', ')}.`,
    });
  }

  const employeeName = [employee.name, employee.surname].filter(Boolean).join(' ').trim();
  const normalizedValue = normalizeAttendanceValues(value);
  const now = new Date();

  const documents = datesToCreate.map((attendanceDate) => ({
    ...normalizedValue,
    employee: employee._id,
    employeeIdSnapshot: employee.employeeId,
    employeeName,
    createdBy: req.admin._id,
    removed: false,
    enabled: true,
    attendanceDate,
    updated: now,
  }));

  const results = await Attendance.insertMany(documents);

  return res.status(200).json({
    success: true,
    result: results[0],
    message:
      results.length > 1
        ? `Leave marked successfully for ${results.length} days`
        : 'Attendance marked successfully',
  });
};

module.exports = create;
