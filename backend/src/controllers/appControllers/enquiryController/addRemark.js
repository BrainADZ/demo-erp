const Joi = require('joi');
const mongoose = require('mongoose');

const Enquiry = mongoose.model('Enquiry');

const schema = Joi.object({
  personName: Joi.string().trim().required(),
  note: Joi.string().trim().required(),
});

const addRemark = async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.details[0]?.message,
    });
  }

  const remark = {
    ...value,
    at: new Date(),
  };

  const result = await Enquiry.findOneAndUpdate(
    {
      _id: req.params.id,
      removed: false,
    },
    {
      $push: { remarks: remark },
      $set: {
        lastRemark: remark,
        notes: remark.note,
        updated: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).exec();

  if (!result) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Enquiry not found',
    });
  }

  return res.status(200).json({
    success: true,
    result,
    message: 'Remark added successfully',
  });
};

module.exports = addRemark;
