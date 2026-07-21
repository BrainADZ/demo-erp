const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },
  employee: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    autopopulate: { select: 'employeeId name surname email department jobTitle role enabled' },
    required: true,
  },
  employeeIdSnapshot: {
    type: String,
    trim: true,
  },
  employeeName: {
    type: String,
    trim: true,
  },
  attendanceDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half_day', 'leave', 'work_from_home'],
    default: 'present',
    required: true,
  },
  workMode: {
    type: String,
    enum: ['office', 'remote', 'hybrid', 'field'],
    default: 'office',
  },
  checkIn: {
    type: String,
    trim: true,
  },
  checkOut: {
    type: String,
    trim: true,
  },
  checkOutCapturedAt: {
    type: Date,
  },
  checkOutMethod: {
    type: String,
    enum: ['manual', 'logout', 'system', 'unknown'],
    default: 'unknown',
  },
  sessionStatus: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active',
  },
  autoMarked: {
    type: Boolean,
    default: false,
  },
  loginCapturedAt: {
    type: Date,
  },
  loginIp: {
    type: String,
    trim: true,
  },
  loginSource: {
    type: String,
    enum: ['office', 'remote', 'unknown'],
    default: 'unknown',
  },
  loginBrowser: {
    type: String,
    trim: true,
  },
  loginOs: {
    type: String,
    trim: true,
  },
  loginDevice: {
    type: String,
    trim: true,
  },
  loginUserAgent: {
    type: String,
    trim: true,
  },
  loginTimezone: {
    type: String,
    trim: true,
  },
  loginLanguage: {
    type: String,
    trim: true,
  },
  loginScreen: {
    type: String,
    trim: true,
  },
  loginNetwork: {
    type: String,
    trim: true,
  },
  loginEvents: {
    type: [
      {
        loginAt: Date,
        ip: String,
        source: String,
        browser: String,
        os: String,
        device: String,
        userAgent: String,
        timezone: String,
        language: String,
        screen: String,
        network: String,
      },
    ],
    default: [],
  },
  logoutEvents: {
    type: [
      {
        logoutAt: Date,
        ip: String,
        source: String,
        browser: String,
        os: String,
        device: String,
        userAgent: String,
        timezone: String,
        language: String,
        screen: String,
        network: String,
        reason: String,
        method: String,
      },
    ],
    default: [],
  },
  notes: {
    type: String,
    trim: true,
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'Admin',
    autopopulate: { select: 'name surname employeeId' },
    required: true,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
});

attendanceSchema.index({ employee: 1, attendanceDate: 1, removed: 1 });
attendanceSchema.index({ attendanceDate: -1, sessionStatus: 1, status: 1, workMode: 1 });

attendanceSchema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Attendance', attendanceSchema);
