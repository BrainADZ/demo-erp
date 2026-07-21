const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  removed: {
    type: Boolean,
    default: false,
  },
  enabled: {
    type: Boolean,
    default: true,
  },

  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  clientName: String,
  contact: String,
  email: String,
  phone: String,
  company: String,
  location: String,
  message: String,
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'lost', 'won'],
    default: 'new',
  },
  source: String,
  notes: String,
  remarks: [
    {
      personName: String,
      note: String,
      at: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  lastRemark: {
    personName: String,
    note: String,
    at: Date,
  },
  assigned: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  createdBy: { type: mongoose.Schema.ObjectId, ref: 'Admin' },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  created: {
    type: Date,
    default: Date.now,
  },
  updated: {
    type: Date,
    default: Date.now,
  },
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Enquiry', schema);
