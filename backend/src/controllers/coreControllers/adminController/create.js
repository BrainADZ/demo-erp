const Joi = require('joi');
const mongoose = require('mongoose');
const shortid = require('shortid');

const serializeAdmin = require('@/access/serializeAdmin');
const {
  ROLE_LABELS,
  expandModulesToPermissions,
  normalizeModuleList,
  normalizePermissionList,
} = require('@/access/permissions');
const generateEmployeeId = require('@/access/generateEmployeeId');

const create = async (req, res) => {
  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const newAdminPassword = new AdminPassword();

  const schema = Joi.object({
    name: Joi.string().required(),
    surname: Joi.string().allow(''),
    email: Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string()
      .valid(...Object.keys(ROLE_LABELS))
      .required(),
    enabled: Joi.boolean().default(true),
    department: Joi.string().allow(''),
    jobTitle: Joi.string().allow(''),
    employeeId: Joi.string().allow(''),
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

  const existingAdmin = await Admin.findOne({ email: value.email.toLowerCase(), removed: false }).lean();
  if (existingAdmin) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Admin with this email already exists.',
    });
  }

  const employeeId = value.employeeId || (await generateEmployeeId());
  const existingEmployee = await Admin.findOne({ employeeId, removed: false }).lean();
  if (existingEmployee) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'Employee ID already exists.',
    });
  }

  const salt = shortid.generate();
  const passwordHash = newAdminPassword.generateHash(salt, value.password);
  const normalizedModules = normalizeModuleList(value.permissionModules);
  const normalizedPermissions =
    normalizedModules.length > 0
      ? expandModulesToPermissions(normalizedModules)
      : normalizePermissionList(value.permissions);

  const adminDoc = await new Admin({
    name: value.name,
    surname: value.surname,
    email: value.email.toLowerCase(),
    role: value.role,
    enabled: value.enabled,
    department: value.department || 'general',
    jobTitle: value.jobTitle || ROLE_LABELS[value.role],
    employeeId,
    permissionMode: normalizedPermissions.length > 0 ? 'custom' : 'role',
    permissions: normalizedPermissions,
    permissionModules: normalizedModules,
  }).save();

  await new AdminPassword({
    password: passwordHash,
    emailVerified: true,
    salt,
    user: adminDoc._id,
  }).save();

  return res.status(200).json({
    success: true,
    result: serializeAdmin(adminDoc),
    message: 'Employee account created successfully',
  });
};

module.exports = create;
