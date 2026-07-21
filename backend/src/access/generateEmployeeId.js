const mongoose = require('mongoose');

const generateEmployeeId = async () => {
  const Admin = mongoose.model('Admin');
  const latestAdmin = await Admin.findOne({})
    .sort({ created: -1, _id: -1 })
    .select('employeeId')
    .lean();

  const latestNumber = latestAdmin?.employeeId
    ? Number.parseInt(String(latestAdmin.employeeId).replace(/\D/g, ''), 10)
    : 0;

  return `EMP${String(latestNumber + 1).padStart(4, '0')}`;
};

module.exports = generateEmployeeId;
