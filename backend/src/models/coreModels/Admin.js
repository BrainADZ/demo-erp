const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ALL_PERMISSIONS, ALL_PERMISSION_MODULE_KEYS } = require('@/access/permissions');

const adminSchema = new Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: false,
  },

  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: true,
    unique: true,
  },
  employeeId: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  name: { type: String, required: true },
  surname: { type: String },
  department: {
    type: String,
    default: 'management',
    enum: ['management', 'sales', 'finance', 'operations', 'hr', 'support', 'general'],
  },
  jobTitle: {
    type: String,
    trim: true,
    default: 'Employee',
  },
  photo: {
    type: String,
    trim: true,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  role: {
    type: String,
    default: 'owner',
    enum: ['owner', 'admin', 'manager', 'sales', 'finance', 'employee'],
  },
  permissionMode: {
    type: String,
    default: 'role',
    enum: ['role', 'custom'],
  },
  permissions: {
    type: [String],
    enum: ALL_PERMISSIONS,
    default: [],
  },
  permissionModules: {
    type: [String],
    enum: ALL_PERMISSION_MODULE_KEYS,
    default: [],
  },
});

module.exports = mongoose.model('Admin', adminSchema);
