const mongoose = require('mongoose');
const serializeAdmin = require('@/access/serializeAdmin');

const list = async (req, res) => {
  const Admin = mongoose.model('Admin');
  const page = Number.parseInt(req.query.page, 10) || 1;
  const limit = Number.parseInt(req.query.items, 10) || 10;
  const skip = page * limit - limit;
  const fieldsArray = req.query.fields ? req.query.fields.split(',') : [];
  const query = req.query.q || '';

  const filters =
    fieldsArray.length > 0 && query
      ? {
          $or: fieldsArray.map((field) => ({
            [field]: { $regex: new RegExp(query, 'i') },
          })),
        }
      : {};

  const [result, count] = await Promise.all([
    Admin.find({ removed: false, ...filters })
      .sort({ created: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .exec(),
    Admin.countDocuments({ removed: false, ...filters }),
  ]);

  const pagination = {
    page,
    pages: Math.ceil(count / limit),
    count,
  };

  return res.status(200).json({
    success: true,
    result: result.map((admin) => serializeAdmin(admin)),
    pagination,
    message: 'Successfully found all employees',
  });
};

module.exports = list;
