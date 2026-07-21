const Joi = require('joi');
const mongoose = require('mongoose');

const serializeAdmin = require('@/access/serializeAdmin');
const {
  ROLE_LABELS,
  expandModulesToPermissions,
  normalizeModuleList,
  normalizePermissionList,
} = require('@/access/permissions');

const update = async (req, res) => {
  const Admin = mongoose.model('Admin');

  const schema = Joi.object({
    name: Joi.string().required(),
    surname: Joi.string().allow(''),
    email: Joi.string().email({ tlds: { allow: true } }).required(),
    role: Joi.string()
      .valid(...Object.keys(ROLE_LABELS))
      .required(),
    enabled: Joi.boolean().required(),
    department: Joi.string().allow(''),
    jobTitle: Joi.string().allow(''),
    employeeId: Joi.string().required(),
    permissions: Joi.array().items(Joi.string()).default([]),
    permissionModules: Joi.array().items(Joi.string()).default([]),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.message,
    });
  }

  const existingConflict = await Admin.findOne({
    _id: { $ne: req.params.id },
    $or: [{ email: value.email.toLowerCase() }, { employeeId: value.employeeId }],
    removed: false,
  }).lean();

  if (existingConflict) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Email or employee ID already exists.',
    });
  }

  const normalizedModules = normalizeModuleList(value.permissionModules);
  const normalizedPermissions =
    normalizedModules.length > 0
      ? expandModulesToPermissions(normalizedModules)
      : normalizePermissionList(value.permissions);

  const result = await Admin.findOneAndUpdate(
    { _id: req.params.id, removed: false },
    {
      $set: {
        name: value.name,
        surname: value.surname,
        email: value.email.toLowerCase(),
        role: value.role,
        enabled: value.enabled,
        department: value.department || 'general',
        jobTitle: value.jobTitle || ROLE_LABELS[value.role],
        employeeId: value.employeeId,
        permissionMode: normalizedPermissions.length > 0 ? 'custom' : 'role',
        permissions: normalizedPermissions,
        permissionModules: normalizedModules,
      },
    },
    { new: true, runValidators: true }
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
    message: 'Employee updated successfully',
  });
};

module.exports = update;
