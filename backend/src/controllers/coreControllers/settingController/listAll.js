const mongoose = require('mongoose');
const Model = mongoose.model('Setting');

const listAll = async (req, res) => {
  const result = await Model.aggregate([
    {
      $match: {
        removed: false,
        isPrivate: false,
      },
    },
    {
      $sort: {
        created: -1,
        _id: -1,
      },
    },
    {
      $group: {
        _id: '$settingKey',
        doc: { $first: '$$ROOT' },
      },
    },
    {
      $replaceRoot: {
        newRoot: '$doc',
      },
    },
    {
      $sort: {
        created: -1,
        _id: -1,
      },
    },
  ]);

  if (result.length > 0) {
    return res.status(200).json({
      success: true,
      result,
      message: 'Successfully found all documents',
    });
  } else {
    return res.status(203).json({
      success: false,
      result: [],
      message: 'Collection is Empty',
    });
  }
};

module.exports = listAll;
