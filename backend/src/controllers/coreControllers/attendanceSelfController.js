const mongoose = require('mongoose');
const {
  buildLoginContext,
  buildEmployeeName,
  formatCheckTime,
  getTodayAttendance,
} = require('@/utils/loginTracking');

const Attendance = mongoose.model('Attendance');

const getTodayRecord = async (adminId, date = new Date()) =>
  getTodayAttendance({ employeeId: adminId, date });

const today = async (req, res) => {
  const admin = req.admin;
  const result = await getTodayRecord(admin._id);

  return res.status(200).json({
    success: true,
    result,
    message: 'Today attendance fetched successfully',
  });
};

const checkIn = async (req, res) => {
  const admin = req.admin;
  if (admin.role === 'owner') {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Owner attendance is not tracked automatically.',
    });
  }

  const loginContext = buildLoginContext(req);
  const employeeName = buildEmployeeName(admin);
  const now = new Date();
  const currentCheckIn = formatCheckTime(now);

  let result = await getTodayRecord(admin._id, now);

  if (!result) {
    result = await Attendance.create({
      removed: false,
      enabled: true,
      employee: admin._id,
      employeeIdSnapshot: admin.employeeId,
      employeeName,
      attendanceDate: now,
      status: loginContext.source === 'remote' ? 'work_from_home' : 'present',
      workMode: loginContext.source === 'remote' ? 'remote' : 'office',
      checkIn: currentCheckIn,
      sessionStatus: 'active',
      autoMarked: false,
      loginCapturedAt: now,
      loginIp: loginContext.ip,
      loginSource: loginContext.source,
      loginBrowser: loginContext.browser,
      loginOs: loginContext.os,
      loginDevice: loginContext.device,
      loginUserAgent: loginContext.userAgent,
      loginTimezone: loginContext.timezone,
      loginLanguage: loginContext.language,
      loginScreen: loginContext.screen,
      loginNetwork: loginContext.network,
      loginEvents: [loginContext],
      notes: 'Checked in manually from profile',
      createdBy: admin._id,
      updated: now,
      created: now,
    });
  } else {
    result.checkIn = currentCheckIn;
    result.checkOut = undefined;
    result.checkOutCapturedAt = undefined;
    result.checkOutMethod = 'unknown';
    result.sessionStatus = 'active';
    result.autoMarked = false;
    result.loginCapturedAt = now;
    result.loginIp = loginContext.ip;
    result.loginSource = loginContext.source;
    result.loginBrowser = loginContext.browser;
    result.loginOs = loginContext.os;
    result.loginDevice = loginContext.device;
    result.loginUserAgent = loginContext.userAgent;
    result.loginTimezone = loginContext.timezone;
    result.loginLanguage = loginContext.language;
    result.loginScreen = loginContext.screen;
    result.loginNetwork = loginContext.network;
    result.workMode = loginContext.source === 'remote' ? 'remote' : result.workMode || 'office';
    result.status = result.status === 'absent' ? (loginContext.source === 'remote' ? 'work_from_home' : 'present') : result.status;
    result.notes = result.notes || 'Checked in manually from profile';
    result.loginEvents = [...(result.loginEvents || []), loginContext].slice(-20);
    result.updated = now;
    await result.save();
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Check-in marked successfully',
  });
};

const checkOut = async (req, res) => {
  const admin = req.admin;
  if (admin.role === 'owner') {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'Owner attendance is not tracked automatically.',
    });
  }

  const now = new Date();
  const result = await getTodayRecord(admin._id, now);

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'No attendance record found for today. Please check in first.',
    });
  }

  result.checkOut = formatCheckTime(now);
  result.checkOutCapturedAt = now;
  result.checkOutMethod = 'manual';
  result.sessionStatus = 'closed';
  result.updated = now;
  result.notes = result.notes || 'Checked out manually from profile';
  result.logoutEvents = [
    ...(result.logoutEvents || []),
    {
      logoutAt: now,
      reason: 'manual_check_out',
      method: 'manual',
    },
  ].slice(-20);
  await result.save();

  return res.status(200).json({
    success: true,
    result,
    message: 'Check-out marked successfully',
  });
};

module.exports = {
  today,
  checkIn,
  checkOut,
};
