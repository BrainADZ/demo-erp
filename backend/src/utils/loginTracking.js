const mongoose = require('mongoose');

const Attendance = () => mongoose.model('Attendance');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }

  return (
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

const normalizeIp = (ip = '') => ip.replace('::ffff:', '');

const isOfficeSource = (ipAddress = '') => {
  const normalized = normalizeIp(ipAddress);
  const configuredPrefixes = (process.env.OFFICE_IP_PREFIXES || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (configuredPrefixes.length > 0) {
    return configuredPrefixes.some((prefix) => normalized.startsWith(prefix));
  }

  return (
    normalized === '127.0.0.1' ||
    normalized === '::1' ||
    normalized.startsWith('192.168.') ||
    normalized.startsWith('10.') ||
    normalized.startsWith('172.16.') ||
    normalized.startsWith('172.17.') ||
    normalized.startsWith('172.18.') ||
    normalized.startsWith('172.19.') ||
    normalized.startsWith('172.2') ||
    normalized.startsWith('172.30.') ||
    normalized.startsWith('172.31.')
  );
};

const parseUserAgent = (userAgent = '') => {
  const ua = userAgent || '';

  let browser = 'Unknown';
  if (/Edg/i.test(ua)) browser = 'Edge';
  else if (/OPR|Opera/i.test(ua)) browser = 'Opera';
  else if (/Chrome/i.test(ua)) browser = 'Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
  else if (/Firefox/i.test(ua)) browser = 'Firefox';

  let os = 'Unknown';
  if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  let device = 'Desktop';
  if (/Mobile/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';

  return { browser, os, device };
};

const buildLoginContext = (req) => {
  const clientContext = req.body?.clientContext || {};
  const userAgent = req.headers['user-agent'] || '';
  const ip = getClientIp(req);
  const agentInfo = parseUserAgent(userAgent);
  const loginSource = isOfficeSource(ip) ? 'office' : 'remote';

  return {
    loginAt: new Date(),
    ip,
    source: clientContext.workModeHint || loginSource,
    browser: clientContext.browser || agentInfo.browser,
    os: clientContext.os || agentInfo.os,
    device: clientContext.deviceType || agentInfo.device,
    userAgent,
    timezone: clientContext.timezone || '',
    language: clientContext.language || '',
    screen: clientContext.screen || '',
    network: clientContext.network || '',
  };
};

const formatCheckTime = (date) =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

const getDayRange = (dateInput) => {
  const currentDate = new Date(dateInput);
  const startOfDay = new Date(currentDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);
  return { startOfDay, endOfDay };
};

const buildEmployeeName = (user = {}) => [user.name, user.surname].filter(Boolean).join(' ').trim();

const getTodayAttendance = ({ employeeId, date = new Date() }) => {
  const { startOfDay, endOfDay } = getDayRange(date);

  return Attendance()
    .findOne({
      employee: employeeId,
      attendanceDate: { $gte: startOfDay, $lte: endOfDay },
      removed: false,
    })
    .exec();
};

const markAutomaticAttendanceOnLogin = async ({ req, user }) => {
  if (!user?._id) return null;
  if (user.role === 'owner') return null;

  const loginContext = buildLoginContext(req);
  const employeeName = buildEmployeeName(user);
  const autoStatus = loginContext.source === 'remote' ? 'work_from_home' : 'present';
  const checkIn = formatCheckTime(loginContext.loginAt);

  const existingAttendance = await getTodayAttendance({
    employeeId: user._id,
    date: loginContext.loginAt,
  });

  if (!existingAttendance) {
    return Attendance().create({
      removed: false,
      enabled: true,
      employee: user._id,
      employeeIdSnapshot: user.employeeId,
      employeeName,
      attendanceDate: loginContext.loginAt,
      status: autoStatus,
      workMode: loginContext.source === 'remote' ? 'remote' : 'office',
      checkIn,
      sessionStatus: 'active',
      autoMarked: true,
      loginCapturedAt: loginContext.loginAt,
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
      notes: loginContext.source === 'remote' ? 'Auto-marked from login as remote/WFH' : 'Auto-marked from login',
      createdBy: user._id,
      updated: loginContext.loginAt,
      created: loginContext.loginAt,
    });
  }

  if (existingAttendance.status === 'leave') {
    return existingAttendance;
  }

  const nextLoginEvents = [...(existingAttendance.loginEvents || []), loginContext].slice(-20);
  const shouldSetCheckIn = !existingAttendance.checkIn;
  const wasClosedSession = existingAttendance.sessionStatus === 'closed';
  const updatedNotes =
    existingAttendance.notes ||
    (loginContext.source === 'remote'
      ? 'Auto-updated from remote/WFH login'
      : 'Auto-updated from login');

  existingAttendance.autoMarked = true;
  existingAttendance.loginCapturedAt = loginContext.loginAt;
  existingAttendance.loginIp = loginContext.ip;
  existingAttendance.loginSource = loginContext.source;
  existingAttendance.loginBrowser = loginContext.browser;
  existingAttendance.loginOs = loginContext.os;
  existingAttendance.loginDevice = loginContext.device;
  existingAttendance.loginUserAgent = loginContext.userAgent;
  existingAttendance.loginTimezone = loginContext.timezone;
  existingAttendance.loginLanguage = loginContext.language;
  existingAttendance.loginScreen = loginContext.screen;
  existingAttendance.loginNetwork = loginContext.network;
  existingAttendance.loginEvents = nextLoginEvents;
  existingAttendance.employeeIdSnapshot = user.employeeId;
  existingAttendance.employeeName = employeeName;
  existingAttendance.sessionStatus = 'active';
  existingAttendance.workMode =
    existingAttendance.workMode || (loginContext.source === 'remote' ? 'remote' : 'office');
  existingAttendance.status =
    existingAttendance.status === 'absent' ? autoStatus : existingAttendance.status;
  existingAttendance.notes = updatedNotes;
  if (shouldSetCheckIn) existingAttendance.checkIn = checkIn;
  if (existingAttendance.checkOut && wasClosedSession) {
    existingAttendance.checkOut = undefined;
    existingAttendance.checkOutCapturedAt = undefined;
    existingAttendance.checkOutMethod = 'unknown';
  }
  existingAttendance.updated = loginContext.loginAt;

  await existingAttendance.save();
  return existingAttendance;
};

const markAutomaticAttendanceOnLogout = async ({
  req,
  user,
  reason = 'manual_logout',
  method = 'logout',
}) => {
  if (!user?._id) return null;
  if (user.role === 'owner') return null;

  const logoutContext = buildLoginContext(req);
  const attendance = await getTodayAttendance({
    employeeId: user._id,
    date: logoutContext.loginAt,
  });

  if (!attendance) return null;
  if (attendance.status === 'leave') return attendance;

  attendance.employeeIdSnapshot = user.employeeId;
  attendance.employeeName = buildEmployeeName(user);
  attendance.checkOut = formatCheckTime(logoutContext.loginAt);
  attendance.checkOutCapturedAt = logoutContext.loginAt;
  attendance.checkOutMethod = method;
  attendance.sessionStatus = 'closed';
  attendance.updated = logoutContext.loginAt;
  attendance.logoutEvents = [
    ...(attendance.logoutEvents || []),
    {
      logoutAt: logoutContext.loginAt,
      ip: logoutContext.ip,
      source: logoutContext.source,
      browser: logoutContext.browser,
      os: logoutContext.os,
      device: logoutContext.device,
      userAgent: logoutContext.userAgent,
      timezone: logoutContext.timezone,
      language: logoutContext.language,
      screen: logoutContext.screen,
      network: logoutContext.network,
      reason,
      method,
    },
  ].slice(-20);

  if (!attendance.notes) {
    attendance.notes =
      method === 'logout' ? 'Check-out captured automatically on logout' : 'Check-out captured';
  }

  await attendance.save();
  return attendance;
};

module.exports = {
  buildLoginContext,
  buildEmployeeName,
  formatCheckTime,
  getDayRange,
  getTodayAttendance,
  markAutomaticAttendanceOnLogin,
  markAutomaticAttendanceOnLogout,
};
