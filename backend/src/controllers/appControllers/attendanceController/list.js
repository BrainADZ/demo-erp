const mongoose = require('mongoose');

const Attendance = mongoose.model('Attendance');

const parseBoolean = (value) => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const getSortConfig = ({ sortBy, sortValue }) => {
  if (sortValue && typeof sortValue === 'object' && !Array.isArray(sortValue)) {
    const [field, direction] = Object.entries(sortValue)[0] || [];
    if (field) {
      return {
        [field]: Number(direction) === 1 ? 1 : -1,
      };
    }
  }

  if (typeof sortValue === 'string') {
    const trimmedValue = sortValue.trim();
    if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmedValue);
        return getSortConfig({ sortBy, sortValue: parsed });
      } catch (error) {
        // Ignore malformed JSON and fall back to default handling below
      }
    }
  }

  return {
    [typeof sortBy === 'string' && sortBy ? sortBy : 'attendanceDate']:
      Number(sortValue) === 1 ? 1 : -1,
  };
};

const list = async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.items || 10);
  const skip = page * limit - limit;

  const {
    sortBy = 'attendanceDate',
    sortValue = -1,
    q,
    fields,
    employee,
    status,
    workMode,
    loginSource,
    sessionStatus,
    autoMarked,
    enabled,
    dateFrom,
    dateTo,
  } = req.query;

  const sortConfig = getSortConfig({ sortBy, sortValue });

  const query = { removed: false };

  if (employee) query.employee = employee;
  if (status) query.status = status;
  if (workMode) query.workMode = workMode;
  if (loginSource) query.loginSource = loginSource;
  if (sessionStatus) query.sessionStatus = sessionStatus;

  const autoMarkedValue = parseBoolean(autoMarked);
  if (typeof autoMarkedValue === 'boolean') query.autoMarked = autoMarkedValue;

  const enabledValue = parseBoolean(enabled);
  if (typeof enabledValue === 'boolean') query.enabled = enabledValue;

  if (dateFrom || dateTo) {
    query.attendanceDate = {};
    if (dateFrom) {
      const start = new Date(dateFrom);
      start.setHours(0, 0, 0, 0);
      query.attendanceDate.$gte = start;
    }
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      query.attendanceDate.$lte = end;
    }
  }

  if (q && fields) {
    const searchableFields = fields
      .split(',')
      .map((field) => field.trim())
      .filter(Boolean);

    if (searchableFields.length) {
      query.$or = searchableFields.map((field) => ({
        [field]: { $regex: new RegExp(q, 'i') },
      }));
    }
  }

  const [result, count] = await Promise.all([
    Attendance.find(query)
      .skip(skip)
      .limit(limit)
      .sort(sortConfig)
      .populate()
      .exec(),
    Attendance.countDocuments(query),
  ]);

  return res.status(result.length ? 200 : 203).json({
    success: true,
    result,
    pagination: {
      page,
      pages: Math.ceil(count / limit),
      count,
    },
    message: result.length ? 'Successfully found all documents' : 'Collection is Empty',
  });
};

module.exports = list;
