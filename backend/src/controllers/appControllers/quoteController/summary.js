const mongoose = require('mongoose');

const Model = mongoose.model('Quote');

const summary = async (req, res) => {
  const statuses = ['draft', 'pending', 'sent', 'accepted', 'declined', 'cancelled'];

  const response = await Model.aggregate([
    {
      $match: {
        removed: false,
      },
    },
    {
      $facet: {
        totalQuote: [
          {
            $group: {
              _id: null,
              total: { $sum: '$total' },
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              total: '$total',
              count: '$count',
            },
          },
        ],
        statusCounts: [
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
            },
          },
          {
            $project: {
              _id: 0,
              status: '$_id',
              count: '$count',
            },
          },
        ],
      },
    },
  ]);

  const totalQuotes = response[0].totalQuote?.[0] || { total: 0, count: 0 };
  const statusResult = response[0].statusCounts || [];

  const statusResultMap = statusResult.map((item) => ({
    ...item,
    percentage: totalQuotes.count > 0 ? Math.round((item.count / totalQuotes.count) * 100) : 0,
  }));

  const performance = statuses
    .map((status) => statusResultMap.find((item) => item.status === status))
    .filter(Boolean);

  return res.status(200).json({
    success: true,
    result: {
      total: totalQuotes.total || 0,
      total_undue: 0,
      performance,
    },
    message: 'Successfully found all quotes summary',
  });
};

module.exports = summary;
