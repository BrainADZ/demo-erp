const crypto = require('crypto');
const Joi = require('joi');
const mongoose = require('mongoose');
const shortid = require('shortid');

const generateEmployeeId = require('@/access/generateEmployeeId');

const DEMO_JOB_TITLE = 'Website Demo User';
const DEMO_PERMISSIONS = [
  'dashboard.view',
  'clients.read',
  'clients.list',
  'clients.summary',
  'clients.search',
  'clients.filter',
  'enquiries.read',
  'enquiries.list',
  'enquiries.summary',
  'enquiries.search',
  'enquiries.filter',
  'quotes.read',
  'quotes.list',
  'quotes.summary',
  'quotes.search',
  'quotes.filter',
  'invoices.read',
  'invoices.list',
  'invoices.summary',
  'invoices.search',
  'invoices.filter',
  'payments.read',
  'payments.list',
  'payments.summary',
  'payments.search',
  'payments.filter',
  'taxes.read',
  'taxes.list',
  'taxes.search',
  'taxes.filter',
  'payment_modes.read',
  'payment_modes.list',
  'payment_modes.search',
  'payment_modes.filter',
];

const hasValidProvisionKey = (providedKey = '') => {
  const configuredKey = process.env.DEMO_PROVISION_KEY || '';
  const provided = Buffer.from(String(providedKey));
  const configured = Buffer.from(configuredKey);

  return (
    configured.length >= 32 &&
    provided.length === configured.length &&
    crypto.timingSafeEqual(provided, configured)
  );
};

const provisionDemoUser = async (req, res) => {
  if (!hasValidProvisionKey(req.get('x-demo-provision-key'))) {
    return res.status(401).json({
      success: false,
      result: null,
      message: 'Unauthorized demo provisioning request.',
    });
  }

  const schema = Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email({ tlds: { allow: true } }).required(),
    password: Joi.string().min(12).max(128).required(),
  });
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      success: false,
      result: null,
      message: error.details.map((detail) => detail.message).join(', '),
    });
  }

  const Admin = mongoose.model('Admin');
  const AdminPassword = mongoose.model('AdminPassword');
  const email = value.email.toLowerCase();
  const existingAdmin = await Admin.findOne({ email, removed: false });

  if (existingAdmin && existingAdmin.jobTitle !== DEMO_JOB_TITLE) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'An ERP account already exists for this email. Please use the existing login.',
    });
  }

  const salt = shortid.generate();
  const passwordDocument = new AdminPassword();
  const passwordHash = passwordDocument.generateHash(salt, value.password);

  if (existingAdmin) {
    await AdminPassword.findOneAndUpdate(
      { user: existingAdmin._id },
      {
        $set: {
          password: passwordHash,
          salt,
          emailVerified: true,
          removed: false,
          loggedSessions: [],
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    existingAdmin.name = value.name;
    existingAdmin.enabled = true;
    existingAdmin.role = 'employee';
    existingAdmin.permissionMode = 'custom';
    existingAdmin.permissions = DEMO_PERMISSIONS;
    existingAdmin.permissionModules = [];
    await existingAdmin.save();

    return res.status(200).json({
      success: true,
      result: { accountStatus: 'refreshed' },
      message: 'Demo account credentials refreshed.',
    });
  }

  const admin = await new Admin({
    name: value.name,
    email,
    employeeId: await generateEmployeeId(),
    enabled: true,
    department: 'general',
    jobTitle: DEMO_JOB_TITLE,
    role: 'employee',
    permissionMode: 'custom',
    permissions: DEMO_PERMISSIONS,
    permissionModules: [],
  }).save();

  try {
    await new AdminPassword({
      user: admin._id,
      password: passwordHash,
      salt,
      emailVerified: true,
    }).save();
  } catch (passwordError) {
    await Admin.deleteOne({ _id: admin._id });
    throw passwordError;
  }

  return res.status(201).json({
    success: true,
    result: { accountStatus: 'created' },
    message: 'Demo account created successfully.',
  });
};

module.exports = provisionDemoUser;
