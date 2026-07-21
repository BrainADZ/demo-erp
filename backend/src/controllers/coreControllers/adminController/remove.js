const mongoose = require('mongoose');
const serializeAdmin = require('@/access/serializeAdmin');

const remove = async (req, res) => {
  const Admin = mongoose.model('Admin');

  const result = await Admin.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    { $set: { removed: true, enabled: false } },
    { new: true }
  ).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Employee not found.',
    });
  }

  return res.status(200).json({
    success: true,
    result: serializeAdmin(result),
    message: 'Employee removed successfully',
  });
};

module.exports = remove;
