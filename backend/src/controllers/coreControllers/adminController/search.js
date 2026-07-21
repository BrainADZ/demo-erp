const mongoose = require('mongoose');
const serializeAdmin = require('@/access/serializeAdmin');

const search = async (req, res) => {
  const Admin = mongoose.model('Admin');
  const fieldsArray = req.query.fields ? req.query.fields.split(',') : ['name', 'email', 'employeeId'];

  const query = req.query.q || '';
  const filters = { $or: [] };

  for (const field of fieldsArray) {
    filters.$or.push({ [field]: { $regex: new RegExp(query, 'i') } });
  }

  const result = await Admin.find({
    removed: false,
    ...filters,
  })
    .limit(20)
    .sort({ created: -1, _id: -1 })
    .exec();

  if (result.length === 0) {
    return res.status(202).json({
      success: false,
      result: [],
      message: 'No employee found by this request',
    });
  }

  return res.status(200).json({
    success: true,
    result: result.map((admin) => serializeAdmin(admin)),
    message: 'Successfully found employees',
  });
};

module.exports = search;
